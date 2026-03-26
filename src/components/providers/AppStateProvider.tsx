import React, { useState, useEffect, useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { chrlToProject } from "../../lib/chrl";
import { stageNewerRemoteProjects } from "../../lib/cloudStorage";
import { decompressData } from "../../lib/compress";
import { GUEST_KEY, DEFAULT_CONNECTION_TYPES, DEF_PROJECT_NAME } from "../../lib/constants";
import { loadMeta, loadProjects, saveMeta, saveProjectData, loadProjectData, userExists, deleteProjectData } from "../../lib/localstorage";
import { Meta, Project, GraphData, ProjectServer, ChrlFile, AppState } from "../../lib/types";
import { AppStateContextValue, AppStateContext } from "../../hooks/useAppState";
import { isEmptyProject, makeEmptyProject } from "../../lib/abstractStorage";

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [meta, setMeta] = useState<Meta>(() => loadMeta(GUEST_KEY));
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [userId, setUserId] = useState<string>();

  useEffect(() => {
    const loadedProjects = loadProjects(userId, meta.projectIds);
    setProjects(loadedProjects);
    setLoaded(true);
  }, [meta.projectIds, userId]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", meta.theme ?? "dark");
  }, [meta.theme, userId]);

  const persistMeta = useCallback((next: Meta, uid: string) => {
    setMeta(next);
    saveMeta(next, uid);
  }, []);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === meta.activeProjectId) ?? projects[0] ?? null,
    [projects, meta.activeProjectId]
  );

  const activeData: GraphData = activeProject
    ? {
      characters: activeProject.characters,
      connections: activeProject.connections,
      connectionTypes: activeProject.connectionTypes,
    }
    : {
      characters: [],
      connections: [],
      connectionTypes: [...DEFAULT_CONNECTION_TYPES],
    };

  const saveProject = useCallback((project: Project) => {
    const now = Date.now();
    const updatedProject = { ...project, updatedAt: now };
    saveProjectData(userId, project.id, updatedProject);
    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? project : p)).sort((a, b) => b.updatedAt - a.updatedAt)
    );
    return updatedProject;
  }, [userId]);

  const saveActiveData = useCallback(
    (data: GraphData) => {
      if (!activeProject) return;

      const updated: Project = {
        ...activeProject,
        ...data,
      };

      saveProject(updated);
    },
    [activeProject, saveProject]
  );

  const reloadActiveProject = useCallback(() => {
    if (!meta.activeProjectId) return;
    const fresh = loadProjectData(userId, meta.activeProjectId);
    if (!fresh) return;

    setProjects((prev) => prev.map((p) => (p.id === meta.activeProjectId ? fresh : p)));
  }, [meta.activeProjectId, userId]);

  const resetActiveProject = useCallback(() => {
    if (!activeProject) return;

    const reset: Project = {
      ...activeProject,
      characters: [],
      connections: [],
      connectionTypes: [...DEFAULT_CONNECTION_TYPES],
    };

    saveProject(reset);
  }, [activeProject, saveProject]);

  const updateUser = useCallback((uid: string): { existed: boolean; meta: Meta; projects: Project[] } | null => {
    if (uid === userId) return null;
    const existed = userExists(uid);
    setUserId(uid);

    let userMeta = loadMeta(uid);
    if (!userMeta.activeProjectId) {
      userMeta = createProject(uid, DEF_PROJECT_NAME);
    }
    const loadedProjects = loadProjects(uid, userMeta.projectIds);

    setMeta(userMeta);
    setProjects(loadedProjects);

    return { existed, meta: userMeta, projects: loadedProjects };
  }, [userId]);

  const createProject = useCallback(
    (uid: string, name: string) => {
      const id = uuidv4();
      const project = makeEmptyProject(id, name);

      saveProjectData(uid, id, project);
      setProjects((prev) => [project, ...prev]);
      const newMeta = {
        ...meta,
        projectIds: [id, ...meta.projectIds],
        activeProjectId: id,
      };
      persistMeta(
        newMeta,
        uid
      );
      return newMeta
    },
    [meta, persistMeta]
  );

  const deleteProject = useCallback(
    (id: string, isTemp: boolean) => {
      if (projects.length === 1) return;

      const remaining = projects.filter((p) => p.id !== id);
      deleteProjectData(userId, id);
      if (isTemp) return;

      setProjects(remaining);

      persistMeta(
        {
          ...meta,
          projectIds: remaining.map((p) => p.id),
          activeProjectId: meta.activeProjectId === id ? remaining[0].id : meta.activeProjectId,
        },
        userId
      );
    },
    [projects, meta, persistMeta, userId]
  );

  const syncWithRemote = useCallback(
    (
      remoteProjects: (ProjectServer & { id: string })[],
      currentProjects: Project[],
      currentMeta: Meta,
      currentUser: string
    ) => {
      let projectsInMemory = currentProjects;
      if (currentProjects.length === 1 && isEmptyProject(currentProjects[0]) && remoteProjects.length === 0) {
        return { unsaved: [], staged: [] };
      }
      if (currentProjects.length > 1 || remoteProjects.length >= 1) {
        projectsInMemory = currentProjects.filter(p => !isEmptyProject(p));
        currentProjects.filter(p => isEmptyProject(p)).forEach(p => deleteProject(p.id, false));
      }

      const stagedIds = stageNewerRemoteProjects(currentUser, remoteProjects, projectsInMemory);

      const syncedProjects = remoteProjects
        .map((rp) => {
          try {
            return decompressData<Project>(rp.zippedProject);
          } catch {
            return null;
          }
        })
        .filter((p): p is Project => p !== null);

      const remoteIds = new Set(remoteProjects.map((p) => p.id));
      const localOnlyProjects = projectsInMemory.filter((p) => !remoteIds.has(p.id));
      const nextProjects = [...syncedProjects, ...localOnlyProjects].sort((a, b) => b.updatedAt - a.updatedAt);

      setProjects(nextProjects);

      const nextProjectIds = nextProjects.map((p) => p.id);
      const nextMeta = {
        ...currentMeta,
        projectIds: nextProjectIds,
        activeProjectId: nextProjectIds.includes(currentMeta.activeProjectId)
          ? currentMeta.activeProjectId
          : nextProjectIds[0],
      };

      persistMeta(nextMeta, currentUser);
      return { unsaved: localOnlyProjects, staged: stagedIds };
    },
    [persistMeta, deleteProject]
  );

  const switchProject = useCallback(
    (id: string) => {
      if (!projects.some((p) => p.id === id)) {
        const loadedProject = loadProjectData(userId, id);
        if (loadedProject) {
          setProjects((prev) => [loadedProject, ...prev.filter((p) => p.id !== id)]);
        } else {
          return;
        }
      }

      persistMeta({ ...meta, activeProjectId: id }, userId);
    },
    [projects, meta, persistMeta, userId]
  );

  const setTheme = useCallback(
    (theme: "dark" | "light") => {
      persistMeta({ ...meta, theme }, userId);
    },
    [meta, persistMeta, userId]
  );

  const setLabelBg = useCallback(
    (show: boolean) => {
      persistMeta({ ...meta, useLabelBg: show }, userId);
    },
    [meta, persistMeta, userId]
  );

  const importChrl = useCallback(
    (file: ChrlFile, mode: "append" | "override" | "insert") => {
      const project = chrlToProject(file);
      if (mode === "override" || mode === "insert") {
        saveProject(project);
        persistMeta(
          {
            ...meta,
            projectIds: [project.id, ...meta.projectIds],
            activeProjectId: project.id,
          },
          userId
        );
        return;
      }

      const id = uuidv4();
      const newProject: Project = {
        ...project,
        id,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
      };

      saveProjectData(userId, id, newProject);
      setProjects((prev) => [newProject, ...prev]);

      persistMeta(
        {
          ...meta,
          projectIds: [id, ...meta.projectIds],
          activeProjectId: id,
        },
        userId
      );
    },
    [meta, persistMeta, saveProject, userId]
  );

  const state: AppState = useMemo(
    () => ({
      projects,
      activeProjectId: activeProject?.id ?? meta.activeProjectId,
      projectData: Object.fromEntries(
        projects.map((p) => [
          p.id,
          {
            characters: p.characters,
            connections: p.connections,
            connectionTypes: p.connectionTypes,
          },
        ])
      ),
      theme: meta.theme,
      useLabelBg: meta.useLabelBg ?? true,
    }),
    [projects, activeProject, meta]
  );

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      loaded,
      activeData,
      activeProject,
      updateUser,
      saveActiveData,
      saveProject,
      resetActiveProject,
      createProject,
      reloadActiveProject,
      syncWithRemote,
      deleteProject,
      switchProject,
      setTheme,
      setLabelBg,
      importChrl,
      userId,
    }),
    [
      state,
      loaded,
      activeData,
      activeProject,
      updateUser,
      saveActiveData,
      saveProject,
      resetActiveProject,
      createProject,
      reloadActiveProject,
      syncWithRemote,
      deleteProject,
      switchProject,
      setTheme,
      setLabelBg,
      importChrl,
      userId,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}