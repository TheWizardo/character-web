export default function IconBtn({
    onClick,
    title,
    children,
    active,
}: {
    onClick: () => void;
    title?: string;
    children: React.ReactNode;
    active?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            title={title}
            style={{
                padding: 8,
                borderRadius: 8,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                background: active ? "var(--gold-dim)" : "transparent",
                border: active ? "1px solid var(--gold-border)" : "1px solid transparent",
                color: active ? "var(--gold)" : "var(--text-muted)",
            }}
            onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.color = "var(--gold)";
            }}
            onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.color = "var(--text-muted)";
            }}
        >
            {children}
        </button>
    );
}