import { createContext, useContext } from "react";
import { AppState, GraphData, Project, ChrlFile, Meta, ProjectServer } from "../lib/types";

export interface AppStateContextValue {
  state: AppState;
  loaded: boolean;
  activeData: GraphData;
  activeProject: Project | null;
  updateUser: (uid: string) => { existed: boolean; meta: Meta; projects: Project[] };
  saveActiveData: (data: GraphData) => void;
  saveProject: (p: Project) => void;
  resetActiveProject: () => void;
  createProject: (name: string) => void;
  reloadActiveProject: () => void;
  syncWithRemote: (
    remoteProjects: (ProjectServer & { id: string })[],
    currentProjects: Project[],
    currentMeta: Meta,
    currentUser: string
  ) => { unsaved: Project[], staged: string[] };
  deleteProject: (id: string, isTemp: boolean) => void;
  switchProject: (id: string) => void;
  setTheme: (theme: "dark" | "light") => void;
  setLabelBg: (show: boolean) => void;
  importChrl: (file: ChrlFile, mode: "append" | "override") => void;
  userId: string;
}

export const AppStateContext = createContext<AppStateContextValue | null>(null);

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return ctx;
}