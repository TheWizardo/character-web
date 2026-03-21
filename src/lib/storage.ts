// storage.ts
/**
 * localStorage layout
 *
 * cl:meta    → compressed or plain JSON string of Meta
 * cl:p:{id}  → compressed or plain JSON string of StoredProject
 *
 * Transition support:
 * - old plain JSON localStorage values still load
 * - new values are saved compressed
 * - .chrl files may be plain JSON or compressed base64-gzip text
 */

import { gzipSync, gunzipSync, strToU8, strFromU8 } from "fflate";
import { DEFAULT_CONNECTION_TYPES } from "./constants";
import { GraphData, Project, ConnectionType, ChrlFile, Meta, Connection, Character } from "./types";

// ── keys ─────────────────────────────────────────────────
const K = {
  meta: "cl:meta",
  proj: (id: string) => `cl:p:${id}`,
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
  } catch { }
}

/**
 * Transition-aware read:
 * - if compressed => decompress + parse
 * - otherwise => parse as plain JSON
 */
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
    // Fallback to plain JSON if compression fails
    try {
      lsSetRaw(key, JSON.stringify(val));
    } catch { }
  }
}

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
    "version",
    "name",
    "exportedAt",
    "characters",
    "connections",
    "customTypes",
  ] as const;

  if (!hasOnlyKeys(obj, allowedTopLevel)) return false;

  if (obj.version !== 1) return false;
  if (typeof obj.name !== "string") return false;
  if (typeof obj.exportedAt !== "number" || !Number.isFinite(obj.exportedAt)) return false;
  if (!Array.isArray(obj.characters) || !obj.characters.every(isCharacter)) return false;
  if (!Array.isArray(obj.connections) || !obj.connections.every(isConnection)) return false;
  if (!Array.isArray(obj.customTypes) || !obj.customTypes.every(isConnectionType)) return false;

  const characterIds = new Set(obj.characters.map((c) => c.id));
  if (characterIds.size !== obj.characters.length) return false;

  const customTypeIds = new Set(obj.customTypes.map((t) => t.id));
  if (customTypeIds.size !== obj.customTypes.length) return false;

  const typeIds = new Set([
    ...DEFAULT_CONNECTION_TYPES.map((t) => t.id),
    ...obj.customTypes.map((t) => t.id),
  ]);

  for (const conn of obj.connections) {
    if (!characterIds.has(conn.source) || !characterIds.has(conn.target)) return false;
    if (!typeIds.has(conn.type)) return false;
  }

  return true;
}

// ── public API ────────────────────────────────────────────

export function saveMeta(meta: Meta): void {
  lsSet(K.meta, meta);
}

export function loadMeta(): Meta | null {
  return lsGet<Meta>(K.meta);
}

export function saveProjectData(id: string, data: GraphData): void {
  const stored: GraphData = {
    characters: data.characters,
    connections: data.connections,
    connectionTypes: data.connectionTypes.filter((t) => !t.isDefault), // custom only
  };
  lsSet(K.proj(id), stored);
}

export function loadProjectData(id: string): GraphData {
  const stored = lsGet<GraphData>(K.proj(id));
  const customTypes: ConnectionType[] = stored?.connectionTypes ?? [];

  const connectionTypes = [
    ...DEFAULT_CONNECTION_TYPES,
    ...customTypes.filter((t) => !DEFAULT_CONNECTION_TYPES.some((d) => d.id === t.id)),
  ];

  return {
    characters: (stored?.characters ?? []),
    connections: (stored?.connections ?? []),
    connectionTypes,
  };
}

export function deleteProjectData(id: string): void {
  lsDel(K.proj(id));
}

// ── .chrl export / import ────────────────────────────────
export function downloadChrl(project: Project, data: GraphData): void {
  const payload: ChrlFile = {
    version: 1,
    name: project.name,
    exportedAt: Date.now(),
    characters: data.characters,
    connections: data.connections,
    customTypes: data.connectionTypes.filter((t) => !t.isDefault).map(ct => { ct.isDefault = undefined; return ct }),
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

    if (isCompressed(raw)) {
      const obj = decompressData<ChrlFile>(raw);
      if (!isValidChrlFile(obj)) return null;
      return obj;
    }

    const obj = JSON.parse(raw);
    if (!isValidChrlFile(obj)) return null;
    return obj as ChrlFile;
  } catch {
    return null;
  }
}

/** Reconstruct a full GraphData from an imported .chrl file */
export function chrlToGraphData(file: ChrlFile): GraphData {
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

    // gzip magic bytes
    if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) return false;

    // try full decompression
    gunzipSync(bytes);
    return true;
  } catch {
    return false;
  }
}