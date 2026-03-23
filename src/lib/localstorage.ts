/**
 * localstorage.ts
 *
 * Single responsibility: read and write application data to localStorage.
 * Also owns normalization (merging defaults in) and dehydration (stripping
 * empty fields before write) since those are serialization concerns.
 *
 * Keys:
 *   cl:meta       → Meta
 *   cl:p:{id}     → Project (compressed, dehydrated)
 *   cl:p:{id}:temp → Project (compressed, server version pending confirmation)
 */

import { compressData, decompressData, isCompressed } from "./compress";
import { DEFAULT_CONNECTION_TYPES } from "./constants";
import { Character, Connection, ConnectionType, Meta, Project } from "./types";

// ── keys ─────────────────────────────────────────────────

const K = {
  meta: "cl:meta",
  proj: (id: string, isTemp: boolean) => `cl:p:${id}${isTemp ? ":temp" : ""}`,
};

// ── low-level localStorage helpers ───────────────────────

function lsGetRaw(key: string): string | null {
  try { return localStorage.getItem(key); }
  catch { return null; }
}

function lsSetRaw(key: string, val: string): void {
  try { localStorage.setItem(key, val); } catch {}
}

function lsDel(key: string): void {
  try { localStorage.removeItem(key); }
  catch { console.warn(`Unable to remove ${key} from localStorage`); }
}

function lsGet<T>(key: string): T | null {
  try {
    const raw = lsGetRaw(key);
    if (!raw) return null;
    return isCompressed(raw) ? decompressData<T>(raw) : (JSON.parse(raw) as T);
  } catch { return null; }
}

function lsSet(key: string, val: unknown): void {
  try {
    lsSetRaw(key, compressData(val));
  } catch {
    try { lsSetRaw(key, JSON.stringify(val)); } catch {}
  }
}

// ── dehydration ───────────────────────────────────────────
// Strip empty strings and default values before writing to save space.

function dehydrateCharacter(
  c: Character
): Partial<Character> & Pick<Character, "id" | "name"> {
  const str = (v?: string) => { const t = v?.trim(); return t || undefined; };
  const arr = (v?: string[]) => {
    const a = v?.map((s) => s.trim()).filter(Boolean);
    return a?.length ? a : undefined;
  };
  const fullName = str(c.fullName);
  return {
    id: c.id,
    name: c.name,
    ...(fullName && fullName !== c.name ? { fullName } : {}),
    ...(typeof c.age === "number"        ? { age: c.age }                          : {}),
    ...(str(c.birthDate)                 ? { birthDate: str(c.birthDate) }         : {}),
    ...(str(c.physicalDescription)       ? { physicalDescription: str(c.physicalDescription) } : {}),
    ...(arr(c.hobbies)                   ? { hobbies: arr(c.hobbies) }             : {}),
    ...(str(c.address)                   ? { address: str(c.address) }             : {}),
    ...(str(c.workplace)                 ? { workplace: str(c.workplace) }         : {}),
    ...(str(c.education)                 ? { education: str(c.education) }         : {}),
    ...(str(c.additionalInfo)            ? { additionalInfo: str(c.additionalInfo) } : {}),
    ...(str(c.color)                     ? { color: str(c.color) }                 : {}),
  };
}

function dehydrateProject(p: Project): Project {
  return {
    ...p,
    characters:      p.characters.map(dehydrateCharacter) as Character[],
    connections:     p.connections.map((c: Connection) => ({
      id: c.id, source: c.source, target: c.target, label: c.label, type: c.type,
      ...(c.mutual ? {} : { mutual: false }),
    })),
    connectionTypes: p.connectionTypes.filter((t) => !t.isDefault),
  };
}

// ── normalization ─────────────────────────────────────────
// Re-merge hard-coded defaults after reading from storage.

function normalizeProject(project: Project): Project {
  const custom: ConnectionType[] = project.connectionTypes ?? [];
  return {
    ...project,
    connectionTypes: [
      ...DEFAULT_CONNECTION_TYPES,
      ...custom.filter((t) => !DEFAULT_CONNECTION_TYPES.some((d) => d.id === t.id)),
    ],
  };
}

// ── factory functions ─────────────────────────────────────

export function makeEmptyProject(id: string, name: string): Project {
  const now = Date.now();
  return {
    id, name,
    createdAt: now, updatedAt: now,
    characters: [], connections: [],
    connectionTypes: [...DEFAULT_CONNECTION_TYPES],
  };
}

export function makeMeta(projectId: string): Meta {
  return { projectIds: [projectId], activeProjectId: projectId, theme: "dark", useLabelBg: true };
}

// ── meta ──────────────────────────────────────────────────

export function saveMeta(meta: Meta): void {
  lsSet(K.meta, meta);
}

export function loadMeta(): Meta {
  const existing = lsGet<Meta>(K.meta);

  if (!existing) {
    const id = crypto.randomUUID();
    const meta = makeMeta(id);
    saveProjectData(id, makeEmptyProject(id, "My Story"));
    saveMeta(meta);
    return meta;
  }

  const loaded = loadProjects(existing.projectIds ?? []);

  if (loaded.length === 0) {
    const id = crypto.randomUUID();
    const meta: Meta = { ...existing, projectIds: [id], activeProjectId: id };
    saveProjectData(id, makeEmptyProject(id, "My Story"));
    saveMeta(meta);
    return meta;
  }

  const repaired: Meta = {
    theme:           existing.theme ?? "dark",
    useLabelBg:      existing.useLabelBg ?? true,
    projectIds:      loaded.map((p) => p.id),
    activeProjectId: loaded.some((p) => p.id === existing.activeProjectId)
      ? existing.activeProjectId
      : loaded[0].id,
  };

  const changed =
    repaired.theme           !== existing.theme           ||
    repaired.useLabelBg      !== existing.useLabelBg      ||
    repaired.activeProjectId !== existing.activeProjectId ||
    repaired.projectIds.length !== (existing.projectIds ?? []).length ||
    repaired.projectIds.some((id, i) => id !== existing.projectIds?.[i]);

  if (changed) saveMeta(repaired);
  return repaired;
}

// ── project CRUD ──────────────────────────────────────────

export function saveProjectData(id: string, project: Project): void {
  lsSet(K.proj(id, false), dehydrateProject(project));
}

export function loadProjectData(id: string): Project | null {
  const stored = lsGet<Project>(K.proj(id, false));
  if (!stored) return null;
  return normalizeProject({ ...stored, id });
}

export function loadProjects(projectIds: string[]): Project[] {
  if (!projectIds?.length) return [];
  return projectIds
    .map(loadProjectData)
    .filter((p): p is Project => p !== null)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function deleteProjectData(id: string): void {
  lsDel(K.proj(id, false));
  lsDel(K.proj(id, true)); // clean up temp too if present
}

// ── raw / temp project operations ────────────────────────
// Used by cloudStorage for staging server versions before user confirms.

/** Returns the raw compressed blob stored under a project key. */
export function getRawProject(id: string, isTemp: boolean): string | null {
  return lsGetRaw(K.proj(id, isTemp));
}

/** Writes a raw compressed blob directly (no dehydration — used by sync). */
export function saveRawProject(id: string, zip: string, isTemp: boolean): void {
  lsSetRaw(K.proj(id, isTemp), zip);
}

/**
 * Promotes a temp project to the canonical slot.
 * Deletes the temp key and returns the decoded project.
 */
export function promoteTempProject(id: string): Project {
  const tempData = lsGetRaw(K.proj(id, true));
  if (!tempData) throw new Error(`No temp project found for id: ${id}`);
  lsSetRaw(K.proj(id, false), tempData);
  lsDel(K.proj(id, true));
  return decompressData<Project>(tempData);
}

export function tempProjectExists(id: string): boolean {
  return lsGetRaw(K.proj(id, true)) !== null;
}

export function purgeAllTempProjects(): void {
  const toDelete: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.endsWith(":temp")) toDelete.push(key);
  }
  toDelete.forEach((key) => localStorage.removeItem(key));
}
