/**
 * localStorage layout
 *
 * cl:meta    → { projects, activeProjectId, theme }
 * cl:p:{id}  → { chars: Character[], conns: Connection[], types: ConnectionType[] }
 *
 * "types" stores ONLY custom (non-default) types. Defaults are hard-coded in
 * costants.ts and merged in at load time, keeping stored data minimal.
 */

import { GraphData, Project, Character, Connection, ConnectionType } from "./types";
import { DEFAULT_CONNECTION_TYPES } from "./constants";

// ── keys ─────────────────────────────────────────────────
const K = {
  meta: "cl:meta",
  proj: (id: string) => `cl:p:${id}`,
};

// ── internal shapes ───────────────────────────────────────
interface Meta {
  projects: Project[];
  activeProjectId: string;
  theme?: "dark" | "light";
}

interface StoredProject {
  chars: Character[];
  conns: Connection[];
  types: ConnectionType[]; // custom types only
}

// ── helpers ───────────────────────────────────────────────
function lsGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch { return null; }
}

function lsSet(key: string, val: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { }
}

function lsDel(key: string): void {
  try { localStorage.removeItem(key); } catch { }
}

// ── public API ────────────────────────────────────────────

export function saveMeta(meta: Meta): void {
  lsSet(K.meta, meta);
}

export function loadMeta(): Meta | null {
  return lsGet<Meta>(K.meta);
}

export function saveProjectData(id: string, data: GraphData): void {
  const stored: StoredProject = {
    chars: data.characters,
    conns: data.connections,
    types: data.connectionTypes.filter((t) => !t.isDefault), // custom only
  };
  lsSet(K.proj(id), stored);
}

export function loadProjectData(id: string): GraphData {
  const stored = lsGet<StoredProject>(K.proj(id));
  const customTypes: ConnectionType[] = stored?.types ?? [];
  // Merge: defaults first (preserves order), then any custom additions
  const connectionTypes = [
    ...DEFAULT_CONNECTION_TYPES,
    ...customTypes.filter((t) => !DEFAULT_CONNECTION_TYPES.some((d) => d.id === t.id)),
  ];
  return {
    characters: stored?.chars ?? [],
    connections: stored?.conns ?? [],
    connectionTypes,
  };
}

export function deleteProjectData(id: string): void {
  lsDel(K.proj(id));
}

// ── .chrw export / import ────────────────────────────────

export interface ChrwFile {
  version: 1;
  name: string;
  exportedAt: number;
  characters: Character[];
  connections: Connection[];
  customTypes: ConnectionType[]; // custom only — defaults reconstructed on import
}

export function downloadChrw(project: Project, data: GraphData): void {
  const payload: ChrwFile = {
    version: 1,
    name: project.name,
    exportedAt: Date.now(),
    characters: data.characters,
    connections: data.connections,
    customTypes: data.connectionTypes.filter((t) => !t.isDefault),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${project.name.replaceAll(/[^a-z0-9_\-.]+/gi, "_")}.chrw`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseChrwFile(text: string): ChrwFile | null {
  try {
    const obj = JSON.parse(text);
    if (obj?.version !== 1 || !Array.isArray(obj.characters)) return null;
    return obj as ChrwFile;
  } catch { return null; }
}

/** Reconstruct a full GraphData from an imported .chrw file */
export function chrwToGraphData(file: ChrwFile): GraphData {
  const customTypes: ConnectionType[] = file.customTypes ?? [];
  return {
    characters: file.characters,
    connections: file.connections,
    connectionTypes: [
      ...DEFAULT_CONNECTION_TYPES,
      ...customTypes.filter((t) => !DEFAULT_CONNECTION_TYPES.some((d) => d.id === t.id)),
    ],
  };
}
