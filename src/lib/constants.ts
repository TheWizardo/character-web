import { ConnectionType } from "./types";

export const CHAR_PALLETTE = [
  "#c0392b", "#2980b9", "#16a085", "#8e44ad", "#d97015",
  "#27ae60", "#b3851c", "#7f6036", "#2c3e50", "#e84393"
];
export const CON_PALETTE = [
  "#8b6f47", "#8e44ad", "#0d836c", "#d4a843",
  "#bdc3c7", "#2c3e50", "#ab5835", "#1bedc3"
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
  { id: "romantic", label: "Romantic", emoji: "💕", color: "#e84393", isDefault: true },
  { id: "family", label: "Family", emoji: "🏠", color: "#e67e22", isDefault: true },
  { id: "friendship", label: "Friendship", emoji: "🤝", color: "#27ae60", isDefault: true },
  { id: "rivalry", label: "Rivalry", emoji: "⚔️", color: "#b51503", isDefault: true },
  { id: "professional", label: "Professional", emoji: "💼", color: "#2980b9", isDefault: true },
];

export const RADIUS = 24

export const GUEST_KEY = "guest";
export const DEF_PROJECT_NAME = "My Story"; 