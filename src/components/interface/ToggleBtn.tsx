interface Props {
  label: string;
  state: boolean;
  setState: (b: boolean) => void;
}

export default function ToggleBtn({ label, state, setState }: Props) {
  return <div>
    <label className="cl-label" style={{ marginBottom: 8 }}>{label}</label>
    <button
      onClick={() => setState(!state)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 14px",
        borderRadius: 10,
        cursor: "pointer",
        background: state ? "var(--gold-dim)" : "var(--bg-surface)",
        border: `1px solid ${state ? "var(--gold-border)" : "var(--border-medium)"}`,
        color: state ? "var(--gold)" : "var(--text-muted)",
        fontFamily: "'DM Mono', monospace",
        fontSize: 13,
        transition: "all 0.2s ease",
      }}
    >
      <span>{state ? "Enabled" : "Disabled"}</span>
      <div
        style={{
          width: 42,
          height: 24,
          borderRadius: 999,
          background: state ? "var(--gold)" : "var(--border-medium)",
          position: "relative",
          transition: "all 0.2s ease",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 3,
            left: state ? 21 : 3,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: state ? "var(--bg-deep)" : "var(--bg-base)",
            transition: "all 0.2s ease",
          }}
        />
      </div>
    </button>
  </div>
}