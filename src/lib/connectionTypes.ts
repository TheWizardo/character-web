import { ConnectionType } from "./types";

export const DEFAULT_CONNECTION_TYPES: ConnectionType[] = [
  { id: "romantic",     label: "Romantic",    emoji: "💕", color: "#e84393", isDefault: true },
  { id: "family",       label: "Family",      emoji: "🏠", color: "#e67e22", isDefault: true },
  { id: "friendship",   label: "Friendship",  emoji: "🤝", color: "#27ae60", isDefault: true },
  { id: "rivalry",      label: "Rivalry",     emoji: "⚔️", color: "#c0392b", isDefault: true },
  { id: "professional", label: "Professional",emoji: "💼", color: "#2980b9", isDefault: true },
];
