import { gzipSync, gunzipSync, strToU8, strFromU8 } from "fflate";
import { DEFAULT_CONNECTION_TYPES } from "./constants";
import { GraphData, Project, ConnectionType, ChrlFile, Meta, Connection, Character } from "./types";

// ── keys ─────────────────────────────────────────────────
const K = {
  meta: "cl:meta",
  proj: (id: string, isTemp: boolean) => `cl:p:${id}${isTemp ? ":temp" : ""}`,
};

// ── compression helpers ───────────────────────────────────
export function compressData(data: unknown): string {
  const json = JSON.stringify(data);
  const compressed = gzipSync(strToU8(json));

  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < compressed.length; i += chunkSize) {
    binary += String.fromCharCode(...compressed.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

export function isCompressed(value: unknown): boolean {
  if (typeof value !== "string" || !value) return false;

  try {
    const binary = atob(value);
    if (binary.length < 2) return false;

    const b0 = binary.charCodeAt(0);
    const b1 = binary.charCodeAt(1);

    // gzip magic numbers: 0x1f 0x8b
    return b0 === 0x1f && b1 === 0x8b;
  } catch {
    return false;
  }
}

export function decompressData<T = unknown>(compressed: string): T {
  const binary = atob(compressed);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const json = strFromU8(gunzipSync(bytes));
  return JSON.parse(json) as T;
}
if (typeof window !== "undefined") {
  (window as any).decompress = decompressData;
}

// ── low-level storage helpers ─────────────────────────────
function lsGetRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function lsSetRaw(key: string, val: string): void {
  try {
    localStorage.setItem(key, val);
  } catch { }
}

function lsDel(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    console.warn(`Unable to remove ${key} from ls`)
  }
}

function lsGet<T>(key: string): T | null {
  try {
    const raw = lsGetRaw(key);
    if (!raw) return null;

    if (isCompressed(raw)) {
      return decompressData<T>(raw);
    }

    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function lsSet(key: string, val: unknown): void {
  try {
    const compressed = compressData(val);
    lsSetRaw(key, compressed);
  } catch {
    try {
      lsSetRaw(key, JSON.stringify(val));
    } catch { }
  }
}
// --- dehydration helpers ----------------------------------
export function dehydrateCharacter(c: Character): Partial<Character> & Pick<Character, "id" | "name"> {
  const cleanString = (value?: string): string | undefined => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  };

  const cleanStringArray = (value?: string[]): string[] | undefined => {
    if (!Array.isArray(value)) return undefined;
    const cleaned = value.map((s) => s.trim()).filter(Boolean);
    return cleaned.length ? cleaned : undefined;
  };

  const fullName = cleanString(c.fullName);
  const birthDate = cleanString(c.birthDate);
  const physicalDescription = cleanString(c.physicalDescription);
  const hobbies = cleanStringArray(c.hobbies);
  const address = cleanString(c.address);
  const workplace = cleanString(c.workplace);
  const education = cleanString(c.education);
  const additionalInfo = cleanString(c.additionalInfo);
  const color = cleanString(c.color);

  return {
    id: c.id,
    name: c.name,
    ...(fullName && fullName !== c.name ? { fullName } : {}),
    ...(typeof c.age === "number" ? { age: c.age } : {}),
    ...(birthDate ? { birthDate } : {}),
    ...(physicalDescription ? { physicalDescription } : {}),
    ...(hobbies ? { hobbies } : {}),
    ...(address ? { address } : {}),
    ...(workplace ? { workplace } : {}),
    ...(education ? { education } : {}),
    ...(additionalInfo ? { additionalInfo } : {}),
    ...(color ? { color } : {}),
  };
}

export function dehydrateProject(p: Project): Project {
  return {
    ...p,
    characters: p.characters.map(dehydrateCharacter) as Character[],
    connections: p.connections.map((c) => ({
      id: c.id,
      source: c.source,
      target: c.target,
      label: c.label,
      type: c.type,
      ...(c.mutual ? {} : { mutual: false }),
    })),
    connectionTypes: p.connectionTypes.filter((t) => !t.isDefault),
  };
}

// ── validation helpers ────────────────────────────────────
function isValidChrlFile(obj: unknown): obj is ChrlFile {
  const isPlainObject = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null && !Array.isArray(v);

  const hasOnlyKeys = (value: Record<string, unknown>, allowed: readonly string[]) =>
    Object.keys(value).every((k) => allowed.includes(k));

  const isStringArray = (v: unknown): v is string[] =>
    Array.isArray(v) && v.every((x) => typeof x === "string");

  const isConnectionType = (v: unknown): v is ConnectionType => {
    if (!isPlainObject(v)) return false;

    const allowed = ["id", "label", "emoji", "color", "isDefault"] as const;
    if (!hasOnlyKeys(v, allowed)) return false;

    if (typeof v.id !== "string") return false;
    if (typeof v.label !== "string") return false;
    if (typeof v.emoji !== "string") return false;
    if (typeof v.color !== "string") return false;
    if ("isDefault" in v && typeof v.isDefault !== "boolean") return false;

    return true;
  };

  const isCharacter = (v: unknown): v is Character => {
    if (!isPlainObject(v)) return false;

    const allowed = [
      "id",
      "name",
      "fullName",
      "age",
      "birthDate",
      "physicalDescription",
      "hobbies",
      "address",
      "workplace",
      "education",
      "additionalInfo",
      "color",
    ] as const;

    if (!hasOnlyKeys(v, allowed)) return false;

    if (typeof v.id !== "string") return false;
    if (typeof v.name !== "string") return false;
    if ("fullName" in v && typeof v.fullName !== "string") return false;
    if ("age" in v && typeof v.age !== "number") return false;
    if ("birthDate" in v && typeof v.birthDate !== "string") return false;
    if ("physicalDescription" in v && typeof v.physicalDescription !== "string") return false;
    if ("hobbies" in v && !isStringArray(v.hobbies)) return false;
    if ("address" in v && typeof v.address !== "string") return false;
    if ("workplace" in v && typeof v.workplace !== "string") return false;
    if ("education" in v && typeof v.education !== "string") return false;
    if ("additionalInfo" in v && typeof v.additionalInfo !== "string") return false;
    if ("color" in v && typeof v.color !== "string") return false;

    return true;
  };

  const isConnection = (v: unknown): v is Connection => {
    if (!isPlainObject(v)) return false;

    const allowed = ["id", "source", "target", "label", "type", "mutual"] as const;
    if (!hasOnlyKeys(v, allowed)) return false;

    if (typeof v.id !== "string") return false;
    if (typeof v.source !== "string") return false;
    if (typeof v.target !== "string") return false;
    if (typeof v.label !== "string") return false;
    if (typeof v.type !== "string") return false;
    if ("mutual" in v && typeof v.mutual !== "boolean") return false;

    return true;
  };

  if (!isPlainObject(obj)) return false;

  const allowedTopLevel = [
    "id",
    "name",
    "createdAt",
    "updatedAt",
    "characters",
    "connections",
    "connectionTypes",
    "version",
    "exportedAt",
  ] as const;

  if (!hasOnlyKeys(obj, allowedTopLevel)) return false;

  if (obj.version !== 1) return false;
  if (typeof obj.id !== "string") return false;
  if (typeof obj.name !== "string") return false;
  if (typeof obj.createdAt !== "number" || !Number.isFinite(obj.createdAt)) return false;
  if (typeof obj.updatedAt !== "number" || !Number.isFinite(obj.updatedAt)) return false;
  if (typeof obj.exportedAt !== "number" || !Number.isFinite(obj.exportedAt)) return false;

  if (!Array.isArray(obj.characters) || !obj.characters.every(isCharacter)) return false;
  if (!Array.isArray(obj.connections) || !obj.connections.every(isConnection)) return false;
  if (!Array.isArray(obj.connectionTypes) || !obj.connectionTypes.every(isConnectionType)) return false;

  const characterIds = new Set(obj.characters.map((c) => c.id));
  if (characterIds.size !== obj.characters.length) return false;

  const typeIds = new Set(obj.connectionTypes.map((t) => t.id));
  if (typeIds.size !== obj.connectionTypes.length) return false;

  for (const conn of obj.connections) {
    if (!characterIds.has(conn.source) || !characterIds.has(conn.target)) return false;
    if (!typeIds.has(conn.type)) return false;
  }

  return true;
}

export async function isValidCompressedFile(file: File): Promise<boolean> {
  try {
    const raw = (await file.text()).trim();
    if (!raw) return false;

    const binary = atob(raw);
    if (binary.length < 3) return false;

    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) return false;

    gunzipSync(bytes);
    return true;
  } catch {
    return false;
  }
}

// ── project normalization ─────────────────────────────────
function normalizeProject(project: Project): Project {
  const customTypes: ConnectionType[] = project.connectionTypes ?? [];

  return {
    ...project,
    connectionTypes: [
      ...DEFAULT_CONNECTION_TYPES,
      ...customTypes.filter((t) => !DEFAULT_CONNECTION_TYPES.some((d) => d.id === t.id)),
    ],
  };
}

// ── public API ────────────────────────────────────────────
export function makeEmptyProject(id: string, name: string): Project {
  const now = Date.now();
  return {
    id,
    name,
    createdAt: now,
    updatedAt: now,
    characters: [],
    connections: [],
    connectionTypes: [...DEFAULT_CONNECTION_TYPES],
  };
}

export function makeMeta(projectId: string): Meta {
  return {
    projectIds: [projectId],
    activeProjectId: projectId,
    theme: "dark",
    useLabelBg: true,
  };
}

export function saveMeta(meta: Meta): void {
  lsSet(K.meta, meta);
}

export function loadMeta(): Meta {
  const existing = lsGet<Meta>(K.meta);

  // No meta at all -> create meta + default project
  if (!existing) {
    const id = crypto.randomUUID();
    const project = makeEmptyProject(id, "My Story");
    const meta = makeMeta(id);

    saveProjectData(id, project);
    saveMeta(meta);
    return meta;
  }

  const projectIds = Array.isArray(existing.projectIds) ? existing.projectIds : [];
  const loadedProjects = loadProjects(projectIds);

  // Meta exists but points to nothing -> recreate a default project
  if (loadedProjects.length === 0) {
    const id = crypto.randomUUID();
    const project = makeEmptyProject(id, "My Story");
    const meta: Meta = {
      theme: existing.theme ?? "dark",
      useLabelBg: existing.useLabelBg ?? true,
      projectIds: [id],
      activeProjectId: id,
    };

    saveProjectData(id, project);
    saveMeta(meta);
    return meta;
  }

  // Meta exists but active project is missing -> repair it
  if (!loadedProjects.some((p) => p.id === existing.activeProjectId)) {
    const repaired: Meta = {
      theme: existing.theme ?? "dark",
      useLabelBg: existing.useLabelBg ?? true,
      projectIds: loadedProjects.map((p) => p.id),
      activeProjectId: loadedProjects[0].id,
    };

    saveMeta(repaired);
    return repaired;
  }

  // Also normalize optional settings if missing
  const normalized: Meta = {
    theme: existing.theme ?? "dark",
    useLabelBg: existing.useLabelBg ?? true,
    projectIds: loadedProjects.map((p) => p.id),
    activeProjectId: existing.activeProjectId,
  };

  // Persist only if something changed
  if (
    normalized.theme !== existing.theme ||
    normalized.useLabelBg !== existing.useLabelBg ||
    normalized.activeProjectId !== existing.activeProjectId ||
    normalized.projectIds.length !== projectIds.length ||
    normalized.projectIds.some((id, i) => id !== projectIds[i])
  ) {
    saveMeta(normalized);
  }

  return normalized;
}

export function saveProjectData(id: string, project: Project): void {
  lsSet(K.proj(id, false), dehydrateProject(project));
}

export function getRawProject(id: string, isTemp: boolean): string {
  return lsGetRaw(K.proj(id, isTemp));
}

export function saveProject(id: string, zip: string, isTemp: boolean): void {
  lsSetRaw(K.proj(id, isTemp), zip);
}

export function overwriteProject(id: string): Project {
  const tempKey = K.proj(id, true);
  const tempData = lsGetRaw(tempKey);
  lsSetRaw(K.proj(id, false), tempData);
  lsDel(tempKey);
  return decompressData<Project>(tempData);
}

export function loadProjectData(id: string): Project | null {
  const stored = lsGet<Project>(K.proj(id, false));
  if (!stored) return null;
  return normalizeProject({ ...stored, id });
}

export function loadProjects(projectIds: string[]): Project[] {
  if (!projectIds) {
    return [];
  }
  return projectIds
    .map((id) => loadProjectData(id))
    .filter((p): p is Project => p !== null)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function deleteProjectData(id: string, isTemp: boolean): void {
  lsDel(K.proj(id, isTemp));
}

export function purgeTemp(): void {
  console.log("purging")
  const keysToDelete: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes("temp")) {
      keysToDelete.push(key);
    }
  }

  for (const key of keysToDelete) {
    localStorage.removeItem(key);
  }
}

// ── .chrl export / import ────────────────────────────────
export function downloadChrl(project: Project): void {
  const payload: ChrlFile = {
    ...dehydrateProject(project),
    version: 1,
    exportedAt: Date.now(),
  };

  let fileText: string;
  try {
    fileText = compressData(payload);
  } catch {
    fileText = JSON.stringify(payload, null, 2);
  }

  const blob = new Blob([fileText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${project.name.replaceAll(/[^a-z0-9_\-.]+/gi, "_")}.chrl`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseChrlFile(text: string): ChrlFile | null {
  try {
    const raw = text.trim();
    if (!raw) return null;

    const obj = isCompressed(raw)
      ? decompressData<ChrlFile>(raw)
      : (JSON.parse(raw) as unknown);

    if (!isValidChrlFile(obj)) return null;
    return obj;
  } catch {
    return null;
  }
}

/** Reconstruct a full Project from an imported .chrl file */
export function chrlToProject(file: ChrlFile): Project {
  return {
    id: file.id,
    name: file.name,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
    characters: file.characters,
    connections: file.connections,
    connectionTypes: file.connectionTypes,
  };
}