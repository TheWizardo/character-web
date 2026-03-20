import { useState, useEffect, useCallback } from "react";
import { AppState, GraphData, Project } from "./types";
import { DEFAULT_CONNECTION_TYPES } from "./constants";
import {
  saveMeta, loadMeta, saveProjectData, loadProjectData,
  deleteProjectData, ChrwFile, chrwToGraphData,
} from "./storage";
import { v4 as uuidv4 } from "uuid";

function makeEmptyProject(): GraphData {
  return { characters: [], connections: [], connectionTypes: [...DEFAULT_CONNECTION_TYPES] };
}

function makeInitialMeta() {
  const id = uuidv4();
  return {
    projects: [{ id, name: "My Story", createdAt: Date.now(), updatedAt: Date.now() }] as Project[],
    activeProjectId: id,
    theme: "dark" as const,
  };
}

export function useAppState() {
  // Only store meta (project list + active + theme) in React state.
  // Project data is loaded on-demand and kept in a local cache.
  const [meta, setMeta] = useState(() => {
    return loadMeta() ?? makeInitialMeta();
  });
  const [dataCache, setDataCache] = useState<Record<string, GraphData>>({});
  const [loaded, setLoaded] = useState(false);

  // Load active project data on mount / project switch
  useEffect(() => {
    const id = meta.activeProjectId;
    if (!dataCache[id]) {
      const data = loadProjectData(id);
      setDataCache((prev) => ({ ...prev, [id]: data }));
    }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.activeProjectId]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", meta.theme ?? "dark");
  }, [meta.theme]);

  const persistMeta = useCallback((next: typeof meta) => {
    setMeta(next);
    saveMeta(next);
  }, []);

  const activeData: GraphData =
    dataCache[meta.activeProjectId] ?? loadProjectData(meta.activeProjectId);

  const saveActiveData = useCallback((data: GraphData) => {
    const id = meta.activeProjectId;
    setDataCache((prev) => ({ ...prev, [id]: data }));
    saveProjectData(id, data);
    persistMeta({
      ...meta,
      projects: meta.projects.map((p) =>
        p.id === id ? { ...p, updatedAt: Date.now() } : p
      ),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta, persistMeta]);

  const resetActiveProject = () =>
    saveActiveData({ ...activeData, characters: [], connections: [] });

  const createProject = (name: string) => {
    const id = uuidv4();
    const empty = makeEmptyProject();
    setDataCache((prev) => ({ ...prev, [id]: empty }));
    saveProjectData(id, empty);
    persistMeta({
      ...meta,
      projects: [...meta.projects, { id, name, createdAt: Date.now(), updatedAt: Date.now() }],
      activeProjectId: id,
    });
  };

  const renameProject = (id: string, name: string) =>
    persistMeta({
      ...meta,
      projects: meta.projects.map((p) =>
        p.id === id ? { ...p, name, updatedAt: Date.now() } : p
      ),
    });

  const deleteProject = (id: string) => {
    if (meta.projects.length === 1) return;
    const remaining = meta.projects.filter((p) => p.id !== id);
    deleteProjectData(id);
    setDataCache((prev) => { const n = { ...prev }; delete n[id]; return n; });
    persistMeta({
      ...meta,
      projects: remaining,
      activeProjectId: meta.activeProjectId === id ? remaining[0].id : meta.activeProjectId,
    });
  };

  const switchProject = (id: string) => {
    if (!dataCache[id]) {
      const data = loadProjectData(id);
      setDataCache((prev) => ({ ...prev, [id]: data }));
    }
    persistMeta({ ...meta, activeProjectId: id });
  };

  const setTheme = (theme: "dark" | "light") =>
    persistMeta({ ...meta, theme });

  const importChrw = (file: ChrwFile, mode: "append" | "override") => {
    const data = chrwToGraphData(file);
    if (mode === "override") {
      saveActiveData(data);
      persistMeta({
        ...meta,
        projects: meta.projects.map((p) =>
          p.id === meta.activeProjectId ? { ...p, name: file.name, updatedAt: Date.now() } : p
        ),
      });
    } else {
      const id = uuidv4();
      setDataCache((prev) => ({ ...prev, [id]: data }));
      saveProjectData(id, data);
      persistMeta({
        ...meta,
        projects: [...meta.projects, { id, name: file.name, createdAt: Date.now(), updatedAt: Date.now() }],
        activeProjectId: id,
      });
    }
  };

  // Build AppState shape expected by components that read state.projects etc.
  const state: AppState = {
    projects: meta.projects,
    activeProjectId: meta.activeProjectId,
    projectData: dataCache,
    theme: meta.theme,
  };

  return {
    state, loaded,
    activeData, saveActiveData, resetActiveProject,
    createProject, renameProject, deleteProject, switchProject, setTheme, importChrw,
    activeProject: meta.projects.find((p) => p.id === meta.activeProjectId)!,
  };
}
