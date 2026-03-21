export default function ToolBtn({ onClick, children, gold, active, style }: {
    onClick: () => void; children: React.ReactNode; gold?: boolean; active?: boolean, style?: any;
}) {
    return (
        <button onClick={onClick} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 14px", borderRadius: 8, cursor: "pointer",
            fontFamily: "'DM Mono', monospace", fontSize: 13,
            background: gold ? "linear-gradient(135deg, rgba(139,111,71,0.3), var(--gold-dim))"
                : active ? "var(--gold-dim)" : "var(--bg-surface)",
            border: `1px solid ${gold || active ? "var(--gold-border)" : "var(--border-medium)"}`,
            color: gold || active ? "var(--gold)" : "var(--text-muted)",
            transition: "transform 0.12s", ...style
        }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
            {children}
        </button>
    );
}