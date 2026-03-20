import { useRef, useState } from "react";
import { X, Moon, Sun, Upload, AlertTriangle } from "lucide-react";
import { parseChrwFile, ChrwFile } from "../lib/storage";

interface Props {
  theme: "dark" | "light";
  onSetTheme: (t: "dark" | "light") => void;
  onImport: (file: ChrwFile, mode: "append" | "override") => void;
  onClose: () => void;
}

export default function SiteSettingsModal({ theme, onSetTheme, onImport, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<ChrwFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseChrwFile(text);
      if (!parsed) { setError("Invalid .chrw file. Please check the file and try again."); return; }
      setPending(parsed);
    };
    reader.readAsText(file);
    // reset so same file can be re-selected
    e.target.value = "";
  };

  const confirm = (mode: "append" | "override") => {
    if (!pending) return;
    onImport(pending, mode);
    setPending(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--overlay)" }}>
      <div className="w-full max-w-sm rounded-xl overflow-hidden scale-in"
        style={{ background: "var(--panel-gradient)", border: "1px solid var(--border-medium)", boxShadow: "0 40px 80px var(--shadow-xl)" }}>

        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <h3 className="font-display text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Settings
          </h3>
          <button onClick={onClose}
            className="appearance-none rounded border-0 outline-none bg-transparent hover:bg-white/10 transition-colors"
            style={{ color: "var(--text-muted)", cursor: "pointer", display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* ── Theme ──────────────────────────────────── */}
          <div>
            <label className="cl-label" style={{ marginBottom: 8 }}>Theme</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {(["dark", "light"] as const).map((t) => (
                <button key={t} onClick={() => onSetTheme(t)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                    padding: "14px 12px", borderRadius: 12, cursor: "pointer",
                    background: theme === t ? "var(--gold-dim)" : "var(--bg-surface)",
                    border: `1.5px solid ${theme === t ? "var(--gold-border)" : "var(--border-subtle)"}`,
                  }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    background: t === "dark" ? "#1a1410" : "#f0e6d3",
                    border: `2px solid ${theme === t ? "var(--gold)" : "var(--border-medium)"}`,
                    boxShadow: theme === t ? "0 0 12px var(--gold)" : "none",
                  }}>
                    {t === "dark"
                      ? <Moon size={18} style={{ color: "#d4a843" }} />
                      : <Sun size={18} style={{ color: "#a87818" }} />}
                  </div>
                  <span className="font-mono text-sm capitalize"
                    style={{ color: theme === t ? "var(--gold)" : "var(--text-muted)", fontWeight: theme === t ? 600 : 400 }}>
                    {t}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Import ─────────────────────────────────── */}
          <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 20 }}>
            <label className="cl-label" style={{ marginBottom: 8 }}>Import Story (.chrw)</label>

            {!pending ? (
              <>
                <input
                  ref={fileRef} type="file" accept=".chrw"
                  style={{ display: "none" }}
                  onChange={handleFile} />
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "12px 16px", borderRadius: 8, cursor: "pointer",
                    background: "var(--bg-surface)", border: "1px dashed var(--border-medium)",
                    color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", fontSize: 13,
                  }}>
                  <Upload size={15} style={{ color: "var(--gold)", flexShrink: 0 }} />
                  <div style={{ textAlign: "left" }}>
                    <p style={{ color: "var(--text-secondary)" }}>Choose .chrw file</p>
                    <p style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>Exported from Character Loom©</p>
                  </div>
                </button>
                {error && (
                  <p style={{ marginTop: 8, fontSize: 12, color: "#c0392b", fontFamily: "'DM Mono', monospace", display: "flex", alignItems: "center", gap: 6 }}>
                    <AlertTriangle size={12} /> {error}
                  </p>
                )}
              </>
            ) : (
              <div style={{ borderRadius: 10, padding: 14, background: "var(--bg-surface)", border: "1px solid var(--border-medium)" }}>
                <p className="font-display text-base font-semibold" style={{ color: "var(--text-primary)", marginBottom: 4 }}>
                  "{pending.name}"
                </p>
                <p className="font-mono text-xs" style={{ color: "var(--text-muted)", marginBottom: 14 }}>
                  {pending.characters.length} characters · {pending.connections.length} connections
                </p>
                <p className="cl-label" style={{ marginBottom: 8 }}>How to import?</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <button onClick={() => confirm("append")}
                    style={{
                      padding: "10px 14px", borderRadius: 8, cursor: "pointer", textAlign: "left",
                      background: "var(--gold-dim)", border: "1px solid var(--gold-border)",
                      color: "var(--gold)", fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 600,
                    }}>
                    Add as new story
                  </button>
                  <button onClick={() => confirm("override")}
                    style={{
                      padding: "10px 14px", borderRadius: 8, cursor: "pointer", textAlign: "left",
                      background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.3)",
                      color: "#c0392b", fontFamily: "'DM Mono', monospace", fontSize: 12,
                    }}>
                    Replace current story
                  </button>
                  <button onClick={() => { setPending(null); setError(null); }}
                    style={{
                      padding: "8px 14px", borderRadius: 8, cursor: "pointer",
                      background: "transparent", border: "1px solid var(--border-subtle)",
                      color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", fontSize: 12,
                    }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
