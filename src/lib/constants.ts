import { ConnectionType } from "./types";

export const CHAR_PALLETTE = [
    "#c0392b", "#2980b9", "#16a085", "#8e44ad", "#e67e22",
    "#27ae60", "#d4a843", "#8b6f47", "#2c3e50", "#e84393"
];
export const CON_PALETTE = [
    "#e84393", "#e67e22", "#27ae60", "#c0392b", "#2980b9", "#8b6f47",
    "#8e44ad", "#16a085", "#d4a843", "#2c3e50", "#e74c3c", "#1abc9c",
];

export const EMOJIS = [
  "🎶", "🎓", "🎖️", "🛠️", "🍕", "🔗", "🌹",
  "👑", "🗡️", "🌿", "🔥", "❄️", "⚖️", "⚓",
  "🎭", "🪄", "🧪", "📜", "🕊️", "🐍", "💀",
  "⚡", "🌊", "🌙", "☀️", "🎯", "✈️", "♾️"
];

export const CRIT_COLOR = "#c0392b"
export const OK_COLOR = "#27ae60"
export const DEF_COLOR = "#8b6f47"

export const DEFAULT_CONNECTION_TYPES: ConnectionType[] = [
  { id: "romantic",     label: "Romantic",    emoji: "💕", color: "#e84393", isDefault: true },
  { id: "family",       label: "Family",      emoji: "🏠", color: "#e67e22", isDefault: true },
  { id: "friendship",   label: "Friendship",  emoji: "🤝", color: "#27ae60", isDefault: true },
  { id: "rivalry",      label: "Rivalry",     emoji: "⚔️", color: "#c0392b", isDefault: true },
  { id: "professional", label: "Professional",emoji: "💼", color: "#2980b9", isDefault: true },
];

export const RADIUS = 24

export const GUEST_KEY = "guest";
export const DEF_PROJECT_NAME = "My Story"; 