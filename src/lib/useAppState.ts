import { useState, useEffect, useCallback, useMemo } from "react";
import { AppState, GraphData, Meta, Project, ChrlFile, ProjectServer } from "./types";
import { DEFAULT_CONNECTION_TYPES } from "./constants";
import {
  saveMeta,
  loadMeta,
  saveProjectData,
  loadProjectData,
  loadProjects,
  deleteProjectData,
  chrlToProject,
  makeEmptyProject,
} from "./localstorage";
import { v4 as uuidv4 } from "uuid";
import { syncProjects } from "./cloudStorage";

export function useAppState() {
  const [meta, setMeta] = useState<Meta | null>(() => loadMeta());
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadedProjects = loadProjects(meta.projectIds);

    // loadMeta already guarantees a valid meta+project setup,
    // so this effect only keeps the in-memory projects in sync.
    setProjects(loadedProjects);
    setLoaded(true);
  }, [meta.projectIds]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", meta.theme ?? "dark");
  }, [meta.theme]);

  const persistMeta = useCallback((next: Meta) => {
    setMeta(next);
    saveMeta(next);
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

  const createProject = (name: string) => {
    const id = uuidv4();
    const project = makeEmptyProject(id, name);

    saveProjectData(id, project);
    setProjects((prev) => [project, ...prev]);

    persistMeta({
      ...meta,
      projectIds: [id, ...meta.projectIds],
      activeProjectId: id,
    });
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
    deleteProjectData(id, isTemp);
    if (isTemp) return;

    setProjects(remaining);

    persistMeta({
      ...meta,
      projectIds: remaining.map((p) => p.id),
      activeProjectId: meta.activeProjectId === id ? remaining[0].id : meta.activeProjectId,
    });
  };

const syncWithRemote = useCallback(
  (remoteProjects: (ProjectServer & { id: string })[]) => {
    // 1. Write remote projects into local storage
    syncProjects(remoteProjects, projects);

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
    });

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

    persistMeta({ ...meta, activeProjectId: id });
  };

  const setTheme = (theme: "dark" | "light") => persistMeta({ ...meta, theme });

  const setLabelBg = (show: boolean) => persistMeta({ ...meta, useLabelBg: show });

  const importChrl = (file: ChrlFile, mode: "append" | "override") => {
    const data = chrlToProject(file);

    if (mode === "override") {
      if (!activeProject) return;

      const updated: Project = {
        ...activeProject,
        name: file.name,
        characters: data.characters,
        connections: data.connections,
        connectionTypes: data.connectionTypes,
        updatedAt: Date.now(),
      };

      saveProject(updated);
      return;
    }

    const id = uuidv4();
    const now = Date.now();
    const project: Project = {
      id,
      name: file.name,
      createdAt: now,
      updatedAt: now,
      characters: data.characters,
      connections: data.connections,
      connectionTypes: data.connectionTypes,
    };

    saveProjectData(id, project);
    setProjects((prev) => [project, ...prev]);

    persistMeta({
      ...meta,
      projectIds: [id, ...meta.projectIds],
      activeProjectId: id,
    });
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