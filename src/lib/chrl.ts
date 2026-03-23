/**
 * chrl.ts
 *
 * Everything about the .chrl file format.
 * Validation, parsing, downloading, and converting to/from Project.
 * No localStorage reads or writes happen here.
 */

import { compressData, decompressData, isCompressed } from "./compress";
import { DEFAULT_CONNECTION_TYPES } from "./constants";
import { Character, ChrlFile, Connection, ConnectionType, Project } from "./types";

// ── validation ────────────────────────────────────────────

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function hasOnlyKeys(obj: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(obj).every((k) => allowed.includes(k));
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function isConnectionType(v: unknown): v is ConnectionType {
  if (!isPlainObject(v)) return false;
  if (!hasOnlyKeys(v, ["id", "label", "emoji", "color", "isDefault"])) return false;
  if (typeof v.id !== "string")    return false;
  if (typeof v.label !== "string") return false;
  if (typeof v.emoji !== "string") return false;
  if (typeof v.color !== "string") return false;
  if ("isDefault" in v && typeof v.isDefault !== "boolean") return false;
  return true;
}

function isCharacter(v: unknown): v is Character {
  if (!isPlainObject(v)) return false;
  if (!hasOnlyKeys(v, ["id","name","fullName","age","birthDate","physicalDescription","hobbies","address","workplace","education","additionalInfo","color"])) return false;
  if (typeof v.id !== "string")   return false;
  if (typeof v.name !== "string") return false;
  if ("fullName"            in v && typeof v.fullName !== "string")            return false;
  if ("age"                 in v && typeof v.age !== "number")                  return false;
  if ("birthDate"           in v && typeof v.birthDate !== "string")            return false;
  if ("physicalDescription" in v && typeof v.physicalDescription !== "string")  return false;
  if ("hobbies"             in v && !isStringArray(v.hobbies))                  return false;
  if ("address"             in v && typeof v.address !== "string")              return false;
  if ("workplace"           in v && typeof v.workplace !== "string")            return false;
  if ("education"           in v && typeof v.education !== "string")            return false;
  if ("additionalInfo"      in v && typeof v.additionalInfo !== "string")       return false;
  if ("color"               in v && typeof v.color !== "string")                return false;
  return true;
}

function isConnection(v: unknown): v is Connection {
  if (!isPlainObject(v)) return false;
  if (!hasOnlyKeys(v, ["id","source","target","label","type","mutual"])) return false;
  if (typeof v.id     !== "string") return false;
  if (typeof v.source !== "string") return false;
  if (typeof v.target !== "string") return false;
  if (typeof v.label  !== "string") return false;
  if (typeof v.type   !== "string") return false;
  if ("mutual" in v && typeof v.mutual !== "boolean") return false;
  return true;
}

function isValidChrlFile(obj: unknown): obj is ChrlFile {
  if (!isPlainObject(obj)) return false;
  if (!hasOnlyKeys(obj, ["id","name","createdAt","updatedAt","characters","connections","connectionTypes","version","exportedAt"])) return false;

  if (obj.version !== 1)                                                        return false;
  if (typeof obj.id        !== "string")                                        return false;
  if (typeof obj.name      !== "string")                                        return false;
  if (typeof obj.createdAt !== "number" || !Number.isFinite(obj.createdAt))    return false;
  if (typeof obj.updatedAt !== "number" || !Number.isFinite(obj.updatedAt))    return false;
  if (typeof obj.exportedAt !== "number" || !Number.isFinite(obj.exportedAt))  return false;

  if (!Array.isArray(obj.characters)     || !obj.characters.every(isCharacter))      return false;
  if (!Array.isArray(obj.connections)    || !obj.connections.every(isConnection))     return false;
  if (!Array.isArray(obj.connectionTypes)|| !obj.connectionTypes.every(isConnectionType)) return false;

  // Referential integrity
  const charIds    = new Set(obj.characters.map((c) => c.id));
  const typeIds    = new Set(obj.connectionTypes.map((t) => t.id));
  const allTypeIds = new Set([...DEFAULT_CONNECTION_TYPES.map((t) => t.id), ...typeIds]);

  if (charIds.size !== obj.characters.length)      return false;
  if (typeIds.size !== obj.connectionTypes.length) return false;
  for (const c of obj.connections) {
    if (!charIds.has(c.source) || !charIds.has(c.target)) return false;
    if (!allTypeIds.has(c.type))                           return false;
  }
  return true;
}

// ── dehydration for export ────────────────────────────────
// Strip empty optional fields and custom-type flag before writing to file.

function dehydrateForExport(p: Project): Project {
  return {
    ...p,
    characters:      p.characters.map((c) => {
      const str = (v?: string) => { const t = v?.trim(); return t || undefined; };
      const arr = (v?: string[]) => { const a = v?.map((s) => s.trim()).filter(Boolean); return a?.length ? a : undefined; };
      const fullName = str(c.fullName);
      return {
        id: c.id, name: c.name,
        ...(fullName && fullName !== c.name ? { fullName } : {}),
        ...(typeof c.age === "number"  ? { age: c.age }                           : {}),
        ...(str(c.birthDate)           ? { birthDate: str(c.birthDate) }          : {}),
        ...(str(c.physicalDescription) ? { physicalDescription: str(c.physicalDescription) } : {}),
        ...(arr(c.hobbies)             ? { hobbies: arr(c.hobbies) }              : {}),
        ...(str(c.address)             ? { address: str(c.address) }              : {}),
        ...(str(c.workplace)           ? { workplace: str(c.workplace) }          : {}),
        ...(str(c.education)           ? { education: str(c.education) }          : {}),
        ...(str(c.additionalInfo)      ? { additionalInfo: str(c.additionalInfo) }: {}),
        ...(str(c.color)               ? { color: str(c.color) }                  : {}),
      } as Character;
    }),
    connections:     p.connections.map((c) => ({
      id: c.id, source: c.source, target: c.target, label: c.label, type: c.type,
      ...(c.mutual ? {} : { mutual: false }),
    })),
    connectionTypes: p.connectionTypes.filter((t) => !t.isDefault)
      .map(({ isDefault: _, ...rest }) => rest as ConnectionType),
  };
}

// ── public API ────────────────────────────────────────────

export function downloadChrl(project: Project): void {
  const payload: ChrlFile = {
    ...dehydrateForExport(project),
    version:    1,
    exportedAt: Date.now(),
  };

  let content: string;
  try { content = compressData(payload); }
  catch { content = JSON.stringify(payload, null, 2); }

  const a    = document.createElement("a");
  a.href     = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
  a.download = `${project.name.replaceAll(/[^a-z0-9_\-.]+/gi, "_")}.chrl`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function parseChrlFile(text: string): ChrlFile | null {
  try {
    const raw = text.trim();
    if (!raw) return null;
    const obj = isCompressed(raw) ? decompressData<ChrlFile>(raw) : (JSON.parse(raw) as unknown);
    return isValidChrlFile(obj) ? obj : null;
  } catch { return null; }
}

/** Convert a parsed .chrl file back to a full Project (merges default types). */
export function chrlToProject(file: ChrlFile): Project {
  const custom = file.connectionTypes ?? [];
  return {
    id:         file.id,
    name:       file.name,
    createdAt:  file.createdAt,
    updatedAt:  file.updatedAt,
    characters: file.characters,
    connections:file.connections,
    connectionTypes: [
      ...DEFAULT_CONNECTION_TYPES,
      ...custom.filter((t) => !DEFAULT_CONNECTION_TYPES.some((d) => d.id === t.id)),
    ],
  };
}
