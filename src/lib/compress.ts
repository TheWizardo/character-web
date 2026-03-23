/**
 * compress.ts
 * Pure gzip codec. No app-specific imports.
 * Everything that deals with compression/decompression lives here.
 */

import { gzipSync, gunzipSync, strToU8, strFromU8 } from "fflate";
import { Character, Connection, Project } from "./types";

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

export function decompressData<T = unknown>(compressed: string): T {
  const binary = atob(compressed);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return JSON.parse(strFromU8(gunzipSync(bytes))) as T;
}

export function isCompressed(value: unknown): boolean {
  if (typeof value !== "string" || !value) return false;
  try {
    const binary = atob(value);
    if (binary.length < 2) return false;
    // gzip magic bytes: 0x1f 0x8b
    return binary.charCodeAt(0) === 0x1f && binary.charCodeAt(1) === 0x8b;
  } catch {
    return false;
  }
}

export async function isValidCompressedFile(file: File): Promise<boolean> {
  try {
    const raw = (await file.text()).trim();
    if (!raw) return false;
    const binary = atob(raw);
    if (binary.length < 3) return false;
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) return false;
    gunzipSync(bytes); // throws if corrupt
    return true;
  } catch {
    return false;
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
    ...(typeof c.age === "number" ? { age: c.age } : {}),
    ...(str(c.birthDate) ? { birthDate: str(c.birthDate) } : {}),
    ...(str(c.physicalDescription) ? { physicalDescription: str(c.physicalDescription) } : {}),
    ...(arr(c.hobbies) ? { hobbies: arr(c.hobbies) } : {}),
    ...(str(c.address) ? { address: str(c.address) } : {}),
    ...(str(c.workplace) ? { workplace: str(c.workplace) } : {}),
    ...(str(c.education) ? { education: str(c.education) } : {}),
    ...(str(c.additionalInfo) ? { additionalInfo: str(c.additionalInfo) } : {}),
    ...(str(c.color) ? { color: str(c.color) } : {}),
  };
}

function dehydrateConnection(c: Connection): Connection {
  return {
    id: c.id,
    source: c.source,
    target: c.target,
    label: c.label,
    type: c.type,
    unmutual: c.unmutual === undefined ? undefined : true,
  }
}

export function dehydrateProject(p: Project): Project {
  return {
    ...p,
    characters: p.characters.map(dehydrateCharacter) as Character[],
    connections: p.connections.map(dehydrateConnection) as Connection[],
    connectionTypes: p.connectionTypes.filter((t) => !t.isDefault),
  };
}