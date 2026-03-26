import { useEffect, useRef, useState } from "react";
import { X, Moon, Sun, Upload, AlertTriangle, Download, Check } from "lucide-react";
import { importFile } from "../../lib/chrl";
import { CRIT_COLOR, GUEST_KEY, OK_COLOR } from "../../lib/constants";
import { ChrlFile } from "../../lib/types";
import { useNotifications } from "../../hooks/useNotifications";
import ToggleBtn from "../interface/ToggleBtn";
import { useAppState } from "../../hooks/useAppState";
import { importWithLink } from "../../lib/abstractStorage";

interface Props {
  theme: "dark" | "light";
  labelBg: boolean;
  onSetTheme: (t: "dark" | "light") => void;
  onSetLabelBg: (b: boolean) => void;
  onImport: (file: ChrlFile, mode: "append" | "override" | "insert") => void;
  onClose: () => void;
}

export default function SiteSettingsModal({ theme, labelBg, onSetTheme, onSetLabelBg, onImport, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [linkCheck, setLinkCheck] = useState(false);
  const [link, setLink] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<ChrlFile | null>(null);
  const [isImportWithFile, setIsImportWithFile] = useState(true);
  const [isImportWithLink, setIsImportWithLink] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const notify = useNotifications();
  const { userId } = useAppState();

  function isValidShareLink(url: URL): boolean {
    try {
      // Optional: restrict to your real frontend domains
      const allowedHosts = new Set([
        "character-loom.com",
        "localhost:3000"
      ]);

      if (!allowedHosts.has(url.host)) return false;

      const parts = url.pathname.split("/").filter(Boolean);

      // Expect: /share/:ownerUid/:pid
      if (parts.length !== 3) return false;
      if (parts[0] !== "share") return false;

      const [, ownerUid, pid] = parts;

      if (!ownerUid || !pid) return false;

      return true;
    } catch {
      return false;
    }
  }

  useEffect(() => {
    (window as any).setLoading = setLoading;
    (window as any).setLinkCheck = setLinkCheck;
  }, [])

  const handleLink = () => {
    if (!link) return;
    const url = new URL(link);
    if (!isValidShareLink(url)) {
      setError("Not a valid Link")
      return;
    }

    if (!userId || userId === GUEST_KEY) return;
    setIsImportWithLink(true);
    setIsImportWithFile(false);
    const { pathname } = url;
    const [ownerUid, pid] = pathname.slice(7).split("/");
    setLoading(true);
    importWithLink(userId, ownerUid, pid).then(res => {
      if (res.collision) setPending(res.project as ChrlFile);
      else {
        setPending(null);
        confirm("insert", res.project as ChrlFile);
      }
      setLinkCheck(true);
      setTimeout(() => setLinkCheck(false), 3000);
    }).catch(err => {
      console.warn(err);
      setError("Unable to fetch story");
    }
    ).finally(() => setLoading(false));
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImportWithFile(true);
    setIsImportWithLink(false);
    importFile(userId, file).then(parsed => {
      if (!parsed) {
        setError("Invalid .chrl file. Please check the file and try again.");
      }
      else {
        if (parsed.collision) setPending(parsed.file);
        else {
          setPending(null);
          confirm("insert", parsed.file);
        }
      }
    }).catch(err => {
      console.warn(err);
      setError("Unable to import .chrl file");
    });
    e.target.value = "";
  };

  const confirm = (mode: "append" | "override" | "insert", file?: ChrlFile) => {
    if (!pending && !file) return;
    const fileToImport = pending ?? file;
    onImport(fileToImport, mode);
    notify.success(`Imported ${fileToImport.name}`)
    setPending(null);
    onClose();
  };

  return (<div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: "var(--overlay)" }}
  >
    <div
      className="w-full max-w-sm rounded-xl overflow-hidden scale-in flex flex-col"
      style={{
        background: "var(--panel-gradient)",
        border: "1px solid var(--border-medium)",
        boxShadow: "0 40px 80px var(--shadow-xl)",
        maxHeight: "88vh"
      }}
    >
      <div
        className="flex items-center justify-between px-6 py-4 shrink-0"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <h2
          className="font-display text-lg font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Site Settings
        </h2>
        <button
          onClick={onClose}
          className="appearance-none rounded border-0 outline-none bg-transparent hover:bg-white/10 transition-colors"
          style={{
            color: "var(--text-muted)",
            cursor: "pointer",
            display: "flex",
          }}
        >
          <X size={18} />
        </button>
      </div>

      <div
        className="px-6 py-5 overflow-y-auto min-h-0"
        style={{ display: "flex", flexDirection: "column", gap: 24 }}
      >

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

        {/* ── Label background ───────────────────────── */}
        <ToggleBtn label="Link Label Background" state={labelBg} setState={onSetLabelBg} />

        {/* ── Donations for the poor ───────────────────────── */}
        <div>
          <label className="cl-label" style={{ marginBottom: 8 }}>Support this project</label>
          <a
            href="https://www.paypal.com/paypalme/BooksByOss"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg text-sm font-mono transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, var(--text-muted), var(--gold))",
              color: "var(--bg-deep)",
              border: "1px solid var(--gold-border)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              width: "100%",
            }}
          >
            <span style={{
              margin: "0 auto",
              fontWeight: 600,
            }}>
              ☕ Buy me a coffee
            </span>
          </a>
        </div>

        {/* ── Import ─────────────────────────────────── */}
        <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 20 }}>
          {isImportWithLink && !pending && <div>
            <p className="cl-label mb-3">Import with Link</p>
            <div
              className="flex items-stretch mb-2"
            >
              <input
                onChange={(e) => setLink(e.target.value)}
                placeholder={"Paste your link here..."}
                aria-label="Public link"
                className="flex-1 min-w-0 px-3 py-2.5 text-sm"
                style={{
                  background: "var(--bg-input)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                  fontFamily: "'DM Mono', monospace",
                  borderTopLeftRadius: 8,
                  borderBottomLeftRadius: 8
                }}
              />

              <button
                onClick={handleLink}
                aria-label={linkCheck ? "Copied" : "Copy link"}
                className="relative w-11 transition-all duration-200 active:scale-95"
                style={{
                  background: linkCheck ? "rgba(46, 204, 113, 0.14)" : "var(--gold-border)",
                  border: linkCheck
                    ? "1px solid rgba(46, 204, 113, 0.35)"
                    : "1px solid var(--gold-border)",
                  color: linkCheck ? OK_COLOR : "var(--gold)",
                  borderTopRightRadius: 8,
                  borderBottomRightRadius: 8
                }}
              >
                <div
                  className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${linkCheck ? "opacity-0 scale-75" : "opacity-100 scale-100"
                    }`}
                >
                  <div className="relative flex items-center justify-center w-5 h-5">
                    {loading && <span style={{
                      position: "absolute",
                      inset: -4,
                      borderRadius: "50%",
                      border: "2px solid color-mix(in srgb, var(--gold) 22%, transparent)",
                      borderBottomColor: "var(--gold)",
                      animation: "cl-spin 1.35s ease-in-out infinite",
                    }} />}
                    <Download size={16} className="relative z-10" />
                  </div>
                </div>
                <span
                  className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${linkCheck ? "opacity-100 scale-100" : "opacity-0 scale-75"
                    }`}
                >
                  <Check size={17} strokeWidth={2.5} />
                </span>
              </button>
            </div>
          </div>}

          {isImportWithFile && !pending && <div>
            <label className="cl-label" style={{ marginBottom: 8 }}>Import with file (.chrl)</label>
            <input
              ref={fileRef} type="file" accept=".chrl"
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
                <p style={{ color: "var(--text-secondary)" }}>Choose .chrl file</p>
                <p style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>Exported from Character Loom©</p>
              </div>
            </button>
            {error && (
              <p style={{ marginTop: 8, fontSize: 12, color: CRIT_COLOR, fontFamily: "'DM Mono', monospace", display: "flex", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={12} /> {error}
              </p>
            )}
          </div>}

          {pending &&
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
                    color: CRIT_COLOR, fontFamily: "'DM Mono', monospace", fontSize: 12,
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
          }
        </div>
      </div>
    </div>
  </div>
  );
}
