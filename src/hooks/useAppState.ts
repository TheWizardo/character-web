import { useState, useEffect, useCallback, useMemo } from "react";
import { AppState, GraphData, Meta, Project, ChrlFile, ProjectServer } from "../lib/types";
import { DEFAULT_CONNECTION_TYPES, GUEST_KEY } from "../lib/constants";
import {
  saveMeta,
  loadMeta,
  saveProjectData,
  loadProjectData,
  loadProjects,
  deleteProjectData,
  makeEmptyProject,
  userExists,
} from "../lib/localstorage";
import { v4 as uuidv4 } from "uuid";
import { stageNewerRemoteProjects } from "../lib/cloudStorage";
import { chrlToProject } from "../lib/chrl";

export function useAppState() {
  const [meta, setMeta] = useState<Meta | null>({} as Meta);
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

  const saveProject = useCallback(
    (project: Project) => {
      saveProjectData(project.id, project);
      setProjects((prev) =>
        prev
          .map((p) => (p.id === project.id ? project : p))
          .sort((a, b) => b.updatedAt - a.updatedAt)
      );
    },
    []
  );

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
    if (!meta?.activeProjectId) return;
    const fresh = loadProjectData(meta.activeProjectId);
    if (!fresh) return;

    setProjects((prev) =>
      prev.map((p) => (p.id === meta.activeProjectId ? fresh : p))
    );
  }, [meta?.activeProjectId]);

  const resetActiveProject = () => {
    if (!activeProject) return;
    const reset: Project = {
      ...activeProject,
      characters: [],
      connections: [],
      connectionTypes: [...DEFAULT_CONNECTION_TYPES],
      updatedAt: Date.now(),
    };
    saveProject(reset);
  };

  const updateUser = (uid: string): boolean => {
    const exist = userExists(uid);
    setUser(uid);
    const newMeta = loadMeta(uid);
    const loadedProjects = loadProjects(newMeta.projectIds);
    setMeta(newMeta);
    setProjects(loadedProjects);
    return exist;
  };

  const createProject = (name: string) => {
    const id = uuidv4();
    const project = makeEmptyProject(id, name);

    saveProjectData(id, project);
    setProjects((prev) => [project, ...prev]);

    persistMeta({
      ...meta,
      projectIds: [id, ...meta.projectIds],
      activeProjectId: id,
    }, user);
  };

  const renameProject = (id: string, name: string) => {
    const existing = projects.find((p) => p.id === id);
    if (!existing) return;

    const updated: Project = {
      ...existing,
      name,
      updatedAt: Date.now(),
    };

    saveProject(updated);
  };

  const deleteProject = (id: string, isTemp: boolean) => {
    if (projects.length === 1) return;

    const remaining = projects.filter((p) => p.id !== id);
    deleteProjectData(id);
    if (isTemp) return;

    setProjects(remaining);

    persistMeta({
      ...meta,
      projectIds: remaining.map((p) => p.id),
      activeProjectId: meta.activeProjectId === id ? remaining[0].id : meta.activeProjectId,
    }, user);
  };

  const syncWithRemote = useCallback(
    (remoteProjects: (ProjectServer & { id: string })[]) => {
      // 1. Write remote projects into local storage
      stageNewerRemoteProjects(remoteProjects, projects);

      // 2. Reload all synced projects from local storage
      const syncedProjects = remoteProjects
        .map((rp) => loadProjectData(rp.id))
        .filter((p): p is Project => p !== null);

      // 3. Keep local-only projects too
      const remoteIds = new Set(remoteProjects.map((p) => p.id));
      const localOnlyProjects = projects.filter((p) => !remoteIds.has(p.id));

      const nextProjects = [...syncedProjects, ...localOnlyProjects].sort(
        (a, b) => b.updatedAt - a.updatedAt
      );

      // 4. Update React state
      setProjects(nextProjects);

      // 5. Repair meta.projectIds and activeProjectId
      const nextProjectIds = nextProjects.map((p) => p.id);
      const nextActiveId = nextProjectIds.includes(meta.activeProjectId)
        ? meta.activeProjectId
        : nextProjectIds[0];

      persistMeta({
        ...meta,
        projectIds: nextProjectIds,
        activeProjectId: nextActiveId,
      }, user);

      // 6. Return local-only projects if you still need to upload them
      return localOnlyProjects;
    },
    [projects, meta, persistMeta]
  );

  const switchProject = (id: string) => {
    if (!projects.some((p) => p.id === id)) {
      const loadedProject = loadProjectData(id);
      if (loadedProject) {
        setProjects((prev) => [loadedProject, ...prev.filter((p) => p.id !== id)]);
      } else {
        return;
      }
    }

    persistMeta({ ...meta, activeProjectId: id }, user);
  };

  const setTheme = (theme: "dark" | "light") => persistMeta({ ...meta, theme }, user);

  const setLabelBg = (show: boolean) => persistMeta({ ...meta, useLabelBg: show }, user);

  const importChrl = (file: ChrlFile, mode: "append" | "override") => {
    const project = chrlToProject(file);

    if (mode === "override") {
      saveProject(project);
      persistMeta({
        ...meta,
        activeProjectId: project.id,
      }, user);
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

    persistMeta({
      ...meta,
      projectIds: [id, ...meta.projectIds],
      activeProjectId: id,
    }, user);
  };

  const state: AppState = {
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
  };

  return {
    state,
    loaded,
    activeData,
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
    activeProject,
  };
}