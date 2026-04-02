interface Props {
  changes: {
    version: string;
    description: string[];
  }[];
}

export default function ChangeLog({ changes }: Props) {
  return <div style={{ marginTop: 12 }}>
    <p className="cl-label">Change log</p>
    <div
      style={{
        marginTop: 6,
        padding: "10px 12px",
        borderRadius: 8,
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        maxHeight: 140,
        overflowY: "auto",
      }}
    >
      {changes.slice().reverse().map(({ version, description }) => (
        <div key={version}>
          <p className="font-mono text-xs" style={{ color: "var(--text-secondary)", margin: 0 }}>
            <span style={{ color: "var(--gold)" }}>{version}</span>
          </p>
          <ul
            className="font-mono text-xs"
            style={{
              color: "var(--text-muted)",
              margin: "6px 0 0 0",
              lineHeight: 1.5,
              paddingLeft: 18,
            }}
          >
            {description.map((line, i) => <li key={i}>{line}</li>)}
          </ul>
        </div>))}
    </div>
  </div>
}