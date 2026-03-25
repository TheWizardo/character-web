import { useEffect, useState } from "react";
import { X, AlertTriangle, FileText, Link2 } from "lucide-react";
import { importWithLink } from "../../lib/abstractStorage";
import { CRIT_COLOR } from "../../lib/constants";
import { useNotifications } from "../../hooks/useNotifications";
import { ChrlFile, Project } from "../../lib/types";

interface Props {
  onClose: () => void;
  onImport: (file: ChrlFile, mode: "append" | "override") => void;
}

export default function ImportModal({ onImport, onClose }: Props) {
  const [pending, setPending] = useState<Project | null>();
  const [hasCollision, setHasCollision] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dots, setDots] = useState(0);
  const notify = useNotifications();

  useEffect(() => {
    const { pathname } = window.location;
    const [uid, pid] = pathname.slice(7).split("/");
    setLoading(true)
    const interval = setInterval(() => setDots(d => (d + 1) % 4), 500)
    importWithLink(uid, pid).then(res => {
      setHasCollision(res.collision);
      setPending(res.project);
    }).catch(err => setError("Unable to fetch story")).finally(() => setLoading(false));
    return () => clearInterval(interval);
  }, []);



  const confirm = (mode: "append" | "override", file?: ChrlFile) => {
    if (!pending && !file) return;
    onImport(pending as ChrlFile, mode);
    notify.success(`Imported ${pending.name}`)
    setPending(null);
    onClose();
  };


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--overlay)" }}
    >
      <div
        className="w-full max-w-sm rounded-xl overflow-hidden scale-in"
        style={{
          background: "var(--panel-gradient)",
          border: "1px solid var(--border-medium)",
          boxShadow: "0 40px 80px var(--shadow-xl)",
        }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <h2
            className="font-display text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Import Story
          </h2>
          <button
            onClick={onClose}
            className="appearance-none rounded border-0 outline-none bg-transparent hover:bg-white/10 transition-colors"
            style={{ color: "var(--text-muted)", cursor: "pointer", display: "flex" }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {!pending && (
            <>
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  padding: "14px 16px",
                  borderRadius: 10,
                  background: "var(--bg-surface)",
                  border: "1px dashed var(--border-medium)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Link2 size={16} style={{ color: "var(--gold)", flexShrink: 0 }} />
                  <p style={{ color: "var(--text-secondary)", marginBottom: 2 }}>
                    Import{loading ? "ing" : ""} from link{loading ? ".".repeat(dots) : ""}
                  </p>
                </div>


              </div>

              {error && (
                <p
                  style={{
                    fontSize: 12,
                    color: CRIT_COLOR,
                    fontFamily: "'DM Mono', monospace",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <AlertTriangle size={12} /> {error}
                </p>
              )}
            </>
          )}

          {pending && (
            <>
              <div
                style={{
                  borderRadius: 10,
                  padding: "14px 16px",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-medium)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--gold-dim)",
                      border: "1px solid var(--gold-border)",
                    }}
                  >
                    <FileText size={16} style={{ color: "var(--gold)" }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p
                      className="font-display font-semibold"
                      style={{ color: "var(--text-primary)", fontSize: 16, lineHeight: 1.3 }}
                    >
                      {pending.name}
                    </p>
                  </div>
                </div>
                <p className="font-mono text-xs" style={{ color: "var(--text-muted)", marginBottom: 14 }}>
                  {pending.characters.length} characters · {pending.connections.length} connections
                </p>
              </div>

              {hasCollision && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "rgba(192,57,43,0.07)",
                    border: `1px solid rgba(192,57,43,0.25)`,
                    fontSize: 12,
                    fontFamily: "'DM Mono', monospace",
                    color: CRIT_COLOR,
                  }}
                >
                  <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                  This story already exists in your library.
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  onClick={() => confirm("override")}
                  className="w-full py-2.5 rounded-lg font-mono text-sm font-semibold transition-all hover:scale-[1.02]"
                  style={{
                    background: hasCollision ? "rgba(192,57,43,0.12)" : "var(--gold-dim)",
                    border: `1px solid ${hasCollision ? "rgba(192,57,43,0.35)" : "var(--gold-border)"}`,
                    color: hasCollision ? CRIT_COLOR : "var(--gold)",
                    cursor: "pointer",
                  }}
                >
                  {hasCollision ? "Replace existing story" : "Import"}
                </button>

                {hasCollision && <button
                  onClick={() => confirm("append")}
                  className="w-full py-2.5 rounded-lg font-mono text-sm transition-all hover:scale-[1.02]"
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                  }}
                >
                  Save a copy
                </button>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}