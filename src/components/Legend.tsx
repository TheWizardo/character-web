import { ConnectionType } from "../lib/types";

interface Props {
  types: ConnectionType[];
  highlightTypeId: string | null;
  onHighlight: (id: string | null) => void;
  compact?: boolean; // mobile pill layout
}

export default function Legend({ types, highlightTypeId, onHighlight, compact }: Props) {
  if (types.length === 0) return null;

  if (compact) {
    // Mobile: horizontal pill row
    return (
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 6,
      }}>
        {types.map((t) => {
          const active = highlightTypeId === t.id;
          return (
            <button key={t.id}
              onClick={() => onHighlight(active ? null : t.id)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 10px", borderRadius: 20, cursor: "pointer",
                background: active ? `${t.color}22` : "var(--bg-deep)",
                border: `1px solid ${active ? t.color + "99" : "var(--border-subtle)"}`,
                color: active ? t.color : "var(--text-muted)",
                fontFamily: "'DM Mono', monospace", fontSize: 11,
                fontWeight: active ? 600 : 400,
                opacity: highlightTypeId && !active ? 0.4 : 1,
                backdropFilter: "blur(6px)",
              }}>
              <div style={{ width: 12, height: 1, background: t.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, lineHeight: 1 }}>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Desktop: vertical list
  return (
    <div style={{
      padding: "12px 16px",
      borderRadius: 12,
      background: "var(--bg-deep)",
      border: "1px solid var(--border-subtle)",
      backdropFilter: "blur(8px)",
      maxHeight: "calc(100vh - 120px)",
      overflowY: "auto",
      opacity: 0.93,
    }}>
      <p className="cl-label" style={{ marginBottom: 8 }}>Connections</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {types.map((t) => {
          const active = highlightTypeId === t.id;
          return (
            <button key={t.id}
              onClick={() => onHighlight(active ? null : t.id)}
              title={active ? "Click to deselect" : `Highlight ${t.label}`}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", padding: "5px 6px", borderRadius: 6, cursor: "pointer",
                background: active ? "var(--bg-surface)" : "transparent",
                border: "none", outline: "none",
                opacity: highlightTypeId && !active ? 0.38 : 1,
                transition: "opacity 0.15s",
              }}>
              <div style={{ width: 20, height: 1, flexShrink: 0, background: t.color, boxShadow: active ? `0 0 6px ${t.color}` : "none" }} />
              <span style={{ fontSize: 14, lineHeight: 1 }}>{t.emoji}</span>
              <span style={{
                fontFamily: "'DM Mono', monospace", fontSize: 11,
                color: active ? t.color : "var(--text-muted)",
                fontWeight: active ? 600 : 400,
              }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
