import React, { useState, useEffect, useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { chrlToProject } from "../../lib/chrl";
import { stageNewerRemoteProjects } from "../../lib/cloudStorage";
import { decompressData } from "../../lib/compress";
import { GUEST_KEY, DEFAULT_CONNECTION_TYPES } from "../../lib/constants";
import { loadMeta, loadProjects, saveMeta, saveProjectData, loadProjectData, userExists, makeEmptyProject, deleteProjectData } from "../../lib/localstorage";
import { Meta, Project, GraphData, ProjectServer, ChrlFile, AppState } from "../../lib/types";
import { AppStateContextValue, AppStateContext } from "../../hooks/useAppState";
import { isEmptyProject } from "../../lib/abstractStorage";

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [meta, setMeta] = useState<Meta>(() => loadMeta(GUEST_KEY));
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [user, setUser] = useState<string>(GUEST_KEY);

  useEffect(() => {
    const loadedProjects = loadProjects(meta.projectIds);
    setProjects(loadedProjects);
    setLoaded(true);
  }, [meta.projectIds]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", meta.theme ?? "dark");
  }, [meta.theme]);

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
    saveProjectData(project.id, project);
    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? project : p)).sort((a, b) => b.updatedAt - a.updatedAt)
    );
  }, []);

  const saveActiveData = useCallback(
    (data: GraphData) => {
      if (!activeProject) return;

      const updated: Project = {
        ...activeProject,
        ...data,
        updatedAt: Date.now(),
      };

      saveProject(updated);
    },
    [activeProject, saveProject]
  );

  const reloadActiveProject = useCallback(() => {
    if (!meta.activeProjectId) return;
    const fresh = loadProjectData(meta.activeProjectId);
    if (!fresh) return;

    setProjects((prev) => prev.map((p) => (p.id === meta.activeProjectId ? fresh : p)));
  }, [meta.activeProjectId]);

  const resetActiveProject = useCallback(() => {
    if (!activeProject) return;

    const reset: Project = {
      ...activeProject,
      characters: [],
      connections: [],
      connectionTypes: [...DEFAULT_CONNECTION_TYPES],
      updatedAt: Date.now(),
    };

    saveProject(reset);
  }, [activeProject, saveProject]);

  const updateUser = useCallback((uid: string): { existed: boolean; meta: Meta; projects: Project[] } | null => {
    if (uid === user) return null;
    const existed = userExists(uid);
    setUser(uid);

    const userMeta = loadMeta(uid);
    const loadedProjects = loadProjects(userMeta.projectIds);

    setMeta(userMeta);
    setProjects(loadedProjects);

    return { existed, meta: userMeta, projects: loadedProjects };
  }, [user]);

  const createProject = useCallback(
    (name: string) => {
      const id = uuidv4();
      const project = makeEmptyProject(id, name);

      saveProjectData(id, project);
      setProjects((prev) => [project, ...prev]);

      persistMeta(
        {
          ...meta,
          projectIds: [id, ...meta.projectIds],
          activeProjectId: id,
        },
        user
      );
    },
    [meta, persistMeta, user]
  );

  const renameProject = useCallback(
    (id: string, name: string) => {
      const existing = projects.find((p) => p.id === id);
      if (!existing) return;

      const updated: Project = {
        ...existing,
        name,
        updatedAt: Date.now(),
      };

      saveProject(updated);
    },
    [projects, saveProject]
  );

  const deleteProject = useCallback(
    (id: string, isTemp: boolean) => {
      if (projects.length === 1) return;

      const remaining = projects.filter((p) => p.id !== id);
      deleteProjectData(id);
      if (isTemp) return;

      setProjects(remaining);

      persistMeta(
        {
          ...meta,
          projectIds: remaining.map((p) => p.id),
          activeProjectId: meta.activeProjectId === id ? remaining[0].id : meta.activeProjectId,
        },
        user
      );
    },
    [projects, meta, persistMeta, user]
  );

  const syncWithRemote = useCallback(
    (
      remoteProjects: (ProjectServer & { id: string })[],
      currentProjects: Project[],
      currentMeta: Meta,
      currentUser: string
    ) => {
      stageNewerRemoteProjects(remoteProjects, currentProjects);

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
      const emptyLocals = currentProjects.filter((p) => isEmptyProject(p));
      const localOnlyProjects = currentProjects.filter((p) => !remoteIds.has(p.id) && !isEmptyProject(p));

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

      emptyLocals.forEach(e => deleteProject(e.id, false));

      persistMeta(nextMeta, currentUser);
      return localOnlyProjects;
    },
    [persistMeta]
  );

  const switchProject = useCallback(
    (id: string) => {
      if (!projects.some((p) => p.id === id)) {
        const loadedProject = loadProjectData(id);
        if (loadedProject) {
          setProjects((prev) => [loadedProject, ...prev.filter((p) => p.id !== id)]);
        } else {
          return;
        }
      }

      persistMeta({ ...meta, activeProjectId: id }, user);
    },
    [projects, meta, persistMeta, user]
  );

  const setTheme = useCallback(
    (theme: "dark" | "light") => {
      persistMeta({ ...meta, theme }, user);
    },
    [meta, persistMeta, user]
  );

  const setLabelBg = useCallback(
    (show: boolean) => {
      persistMeta({ ...meta, useLabelBg: show }, user);
    },
    [meta, persistMeta, user]
  );

  const importChrl = useCallback(
    (file: ChrlFile, mode: "append" | "override") => {
      const project = chrlToProject(file);

      if (mode === "override") {
        saveProject(project);
        persistMeta(
          {
            ...meta,
            activeProjectId: project.id,
          },
          user
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

      saveProjectData(id, newProject);
      setProjects((prev) => [newProject, ...prev]);

      persistMeta(
        {
          ...meta,
          projectIds: [id, ...meta.projectIds],
          activeProjectId: id,
        },
        user
      );
    },
    [meta, persistMeta, saveProject, user]
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
      resetActiveProject,
      createProject,
      renameProject,
      reloadActiveProject,
      syncWithRemote,
      deleteProject,
      switchProject,
      setTheme,
      setLabelBg,
      importChrl,
    }),
    [
      state,
      loaded,
      activeData,
      activeProject,
      updateUser,
      saveActiveData,
      resetActiveProject,
      createProject,
      renameProject,
      reloadActiveProject,
      syncWithRemote,
      deleteProject,
      switchProject,
      setTheme,
      setLabelBg,
      importChrl,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}