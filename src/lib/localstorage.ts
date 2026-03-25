/**
 * localstorage.ts
 *
 * Single responsibility: read and write application data to localStorage.
 *
 * Keys:
 *   cl:meta:{uid}  → Metadata for specific user
 *   cl:p:{id}      → Project (compressed, dehydrated)
 *   cl:p:{id}:temp → Project (compressed, server version pending confirmation)
 */

import { makeEmptyProject } from "./abstractStorage";
import { compressData, decompressData, dehydrateProject, isCompressed, normalizeProject } from "./compress";
import { DEF_PROJECT_NAME } from "./constants";
import { Meta, Project } from "./types";

// ── keys ─────────────────────────────────────────────────

const K = {
  meta: (uid: string) => `cl:meta:${uid}`,
  proj: (uid: string, pid: string, isTemp: boolean) => !uid && !pid ? "cl:p:" : `cl:p:${uid}:${pid}${isTemp ? ":temp" : ""}`,
};

// ── low-level localStorage helpers ───────────────────────

function lsGetRaw(key: string): string | null {
  try { return localStorage.getItem(key); }
  catch { return null; }
}

function lsSetRaw(key: string, val: string): void {
  try { localStorage.setItem(key, val); } catch { }
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
    try { lsSetRaw(key, JSON.stringify(val)); } catch { }
  }
}


// ── factory functions ─────────────────────────────────────

export function makeMeta(projectId: string): Meta {
  return { projectIds: [projectId], activeProjectId: projectId, theme: "dark", useLabelBg: true };
}

// ── meta ──────────────────────────────────────────────────

export function saveMeta(meta: Meta, uid: string): void {
  if (!uid) return;
  lsSet(K.meta(uid), meta);
}

export function loadMeta(uid: string): Meta {
  if (!uid) return;
  const existing = lsGet<Meta>(K.meta(uid));

  if (!existing) {
    const id = crypto.randomUUID();
    const meta = makeMeta(id);
    saveProjectData(uid, id, makeEmptyProject(id, DEF_PROJECT_NAME));
    saveMeta(meta, uid);
    return meta;
  }

  const loaded = loadProjects(uid, existing.projectIds ?? []);

  if (loaded.length === 0) {
    const id = crypto.randomUUID();
    const meta: Meta = { ...existing, projectIds: [id], activeProjectId: id };
    saveProjectData(uid, id, makeEmptyProject(id, DEF_PROJECT_NAME));
    saveMeta(meta, uid);
    return meta;
  }

  const repaired: Meta = {
    theme: existing.theme ?? "dark",
    useLabelBg: existing.useLabelBg ?? true,
    projectIds: loaded.map((p) => p.id),
    activeProjectId: loaded.some((p) => p.id === existing.activeProjectId)
      ? existing.activeProjectId
      : loaded[0].id,
  };

  const changed =
    repaired.theme !== existing.theme ||
    repaired.useLabelBg !== existing.useLabelBg ||
    repaired.activeProjectId !== existing.activeProjectId ||
    repaired.projectIds.length !== (existing.projectIds ?? []).length ||
    repaired.projectIds.some((id, i) => id !== existing.projectIds?.[i]);

  if (changed) saveMeta(repaired, uid);
  return repaired;
}

// ── project CRUD ──────────────────────────────────────────

export function saveProjectData(uid: string, pid: string, project: Project): void {
  lsSet(K.proj(uid, pid, false), dehydrateProject(project));
}

export function loadProjectData(uid: string, pid: string): Project | null {
  const stored = lsGet<Project>(K.proj(uid, pid, false));
  if (!stored) return null;
  return normalizeProject({ ...stored, id: pid });
}

export function loadProjects(uid: string, projectIds: string[]): Project[] {
  if (!projectIds?.length) return [];
  return projectIds
    .map((pid) => loadProjectData(uid, pid))
    .filter((p): p is Project => p !== null)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function deleteProjectData(uid: string, pid: string): void {
  lsDel(K.proj(uid, pid, false));
  lsDel(K.proj(uid, pid, true)); // clean up temp too if present
}

// ── raw / temp project operations ────────────────────────
// Used by cloudStorage for staging server versions before user confirms.

/** Returns the raw compressed blob stored under a project key. */
export function getRawProject(uid: string, pid: string, isTemp: boolean): string | null {
  return lsGetRaw(K.proj(uid, pid, isTemp));
}

/** Writes a raw compressed blob directly (no dehydration — used by sync). */
export function saveRawProject(uid: string, pid: string, zip: string, isTemp: boolean): void {
  lsSetRaw(K.proj(uid, pid, isTemp), zip);
}

/**
 * Promotes a temp project to the canonical slot.
 * Deletes the temp key and returns the decoded project.
 */
export function promoteTempProject(uid: string, pid: string): Project {
  const tempData = lsGetRaw(K.proj(uid, pid, true));
  if (!tempData) throw new Error(`No temp project found for id: ${pid}`);
  lsSetRaw(K.proj(uid, pid, false), tempData);
  lsDel(K.proj(uid, pid, true));
  return decompressData<Project>(tempData);
}

function keyExists(k: string): boolean {
  return lsGetRaw(k) !== null;
}

export function projectExists(uid: string, pid: string, isTemp: boolean): boolean {
  return keyExists(K.proj(uid, pid, isTemp));
}

export function userExists(uid: string): boolean {
  return keyExists(K.meta(uid));
}

export function cleanRadicalProjects() {
  const metaHeader = K.meta("");
  const projectHeader = K.proj("", "", false);
  const metaArr: string[] = [];
  const projectsArr: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(metaHeader)) metaArr.push(key);
    if (key?.startsWith(projectHeader)) projectsArr.push(key);
  }
  metaArr
    .map(m => { return { uid: m.replace(metaHeader, ""), meta: lsGet<Meta>(m) } })
    .forEach(m =>
      m.meta.projectIds.forEach(id => {
        const index = projectsArr.indexOf(K.proj(m.uid, id, false));
        if (index !== -1) {
          projectsArr.splice(index, 1);
        }
      })
    );
  projectsArr.forEach(p => lsDel(p));
}
