import { Character } from "./types";

export function capitalize(s: string): string {
  return `${s.charAt(0).toUpperCase()}${s.slice(1)}`
}

export function getCharById(chars: Character[], id: string): Character | null {
  return chars.find(c => c.id === id) || null;
}