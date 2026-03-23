import { useState } from "react";
import { Project, ConnectionType } from "../../lib/types";
import { X, Check, RotateCcw, Trash2, AlertTriangle, Plus, Settings, Link, Download, CloudUpload } from "lucide-react";
import { downloadChrl } from "../../lib/chrl";
import { CON_PALETTE, CRIT_COLOR, EMOJIS } from "../../lib/constants";
import { uploadProject } from "../../lib/cloudStorage";
import { useNotifications } from "../../hooks/useNotifications";
import { v4 as uuidv4 } from "uuid";

type Tab = "general" | "connections";

interface Props {
  project: Project;
  canDelete: boolean;
  connectionTypes: ConnectionType[];
  characterCount: number;
  connectionCount: number;
  onRename: (name: string) => void;
  onReset: () => void;
  onDelete: () => void;
  onAddConnectionType: (types: ConnectionType) => void;
  onRemoveConnectionType: (id: string) => void;
  onClose: () => void;
}

export default function ProjectSettingsModal({
  project, canDelete, connectionTypes, characterCount, connectionCount,
  onRename, onReset, onDelete, onAddConnectionType, onRemoveConnectionType, onClose
}: Props) {
  const [tab, setTab] = useState<Tab>("general");
  const [name, setName] = useState(project.name);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [pendingTypeDel, setPendingTypeDel] = useState<string | null>(null);

  // Connection types state
  // const [ctDraft, setCtDraft] = useState<ConnectionType[]>(connectionTypes);
  const [newLabel, setNewLabel] = useState("");
  const [newEmoji, setNewEmoji] = useState("🔗");
  const [newColor, setNewColor] = useState(CON_PALETTE[0]);
  const [showEmoji, setShowEmoji] = useState(false);

  const notify = useNotifications();

  const saveRename = () => {
    if (name.trim() && name.trim() !== project.name) onRename(name.trim());
  };

  const addType = () => {
    if (!newLabel.trim()) return;
    
    const id = "custom-" + uuidv4().slice(0, 8);
    const newConnection: ConnectionType = {
      id,
      label: newLabel.trim(),
      emoji: newEmoji,
      color: newColor,
      isDefault: false
    }
    onAddConnectionType(newConnection);
    setNewLabel("");
    setNewEmoji("🔗");
    setNewColor(CON_PALETTE[Math.floor(Math.random() * CON_PALETTE.length)]);
    setShowEmoji(false);
  };


  const btnBase = "flex items-center gap-1.5 px-4 py-2 text-sm font-mono rounded-lg transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--overlay)" }}>
      <div className="w-full max-w-md rounded-xl overflow-hidden scale-in flex flex-col"
        style={{
          background: "var(--panel-gradient)",
          border: "1px solid var(--border-medium)",
          boxShadow: "0 40px 80px var(--shadow-xl)",
          maxHeight: "88vh",
        }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div>
            <h3 className="font-display text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Story Settings
            </h3>
            <p className="font-mono text-xs" style={{ color: "var(--text-muted)", marginTop: 2 }}>
              {characterCount} character{characterCount !== 1 ? "s" : ""} · {connectionCount} connection{connectionCount !== 1 ? "s" : ""}
            </p>
          </div>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }} className="appearance-none rounded border-0 outline-none bg-transparent hover:bg-white/10 transition-colors"><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-3 gap-1 flex-shrink-0 mb-2">
          {([["general", Settings, "General"], ["connections", Link, "Connections"]] as const).map(([id, Icon, label]) => (
            <button key={id} onClick={() => setTab(id as Tab)}
              className={btnBase}
              style={{
                background: tab === id ? "var(--gold-dim)" : "transparent",
                border: `1px solid ${tab === id ? "var(--gold-border)" : "transparent"}`,
                color: tab === id ? "var(--gold)" : "var(--text-muted)",
              }}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* Tab body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {/* ── GENERAL TAB ──────────────────────────────── */}
          {tab === "general" && (
            <div className="space-y-5">
              <div>
                <label className="cl-label">Story Name</label>
                <div className="flex gap-2">
                  <input className="cl-input flex-1" value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveRename()} />
                  <button onClick={saveRename}
                    disabled={!name.trim() || name.trim() === project.name}
                    className={`${btnBase} hover:scale-105 disabled:opacity-40`}
                    style={{ background: "var(--gold-dim)", border: "1px solid var(--gold-border)", color: "var(--gold)" }}>
                    <Check size={13} /> Save
                  </button>
                </div>
              </div>
              {/* Upload */}
              <button
                onClick={() => uploadProject(project.id).then(ok => {
                  if (ok) {
                    notify.success(`Uploaded "${project.name}"`);
                  }
                  else {
                    notify.error(`Unable to uploaded "${project.name}"`);
                  }
                })}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-mono transition-all hover:scale-[1.01]"
                style={{
                  background: "linear-gradient(135deg, var(--text-muted), var(--gold))",
                  color: "var(--bg-deep)",
                  border: "1px solid var(--gold-border)",
                  fontWeight: 600,
                }}
              >
                <CloudUpload size={18} />
                Save Project
              </button>

              {/* Export */}
              <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 16 }}>
                <button
                  onClick={() => downloadChrl(project)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono transition-all hover:scale-[1.01]"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                  <Download size={14} style={{ color: "var(--gold)", flexShrink: 0 }} />
                  <div className="text-left">
                    <p>Export Story</p>
                    <p className="text-xs opacity-60 mt-0.5">Downloads a .chrl file</p>
                  </div>
                </button>
              </div>

              {/* Reset */}
              <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 16 }}>
                {confirmReset ? (
                  <div className="rounded-lg p-4"
                    style={{ background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.25)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={14} style={{ color: CRIT_COLOR }} />
                      <p className="text-sm font-mono" style={{ color: CRIT_COLOR }}>
                        Clear all characters and connections?
                      </p>
                    </div>
                    <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
                      Connection types will be preserved.
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmReset(false)}
                        className="flex-1 py-2 rounded-lg text-sm font-mono"
                        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-medium)", color: "var(--text-muted)" }}>
                        Cancel
                      </button>
                      <button onClick={() => { onReset(); onClose(); }}
                        className="flex-1 py-2 rounded-lg text-sm font-mono font-semibold"
                        style={{ background: "rgba(192,57,43,0.15)", border: "1px solid rgba(192,57,43,0.4)", color: CRIT_COLOR }}>
                        Reset Story
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setConfirmReset(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono transition-all hover:scale-[1.01]"
                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                    <RotateCcw size={14} />
                    <div className="text-left">
                      <p>Reset Story</p>
                      <p className="text-xs opacity-60 mt-0.5">Clears all characters & connections</p>
                    </div>
                  </button>
                )}
              </div>

              {/* Delete */}
              {canDelete && (
                <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 12 }}>
                  {confirmDel ? (
                    <div className="rounded-lg p-4"
                      style={{ background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.25)" }}>
                      <p className="text-sm font-mono mb-3" style={{ color: CRIT_COLOR }}>
                        Delete "{project.name}"? Cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => setConfirmDel(false)}
                          className="flex-1 py-2 rounded-lg text-sm font-mono"
                          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-medium)", color: "var(--text-muted)" }}>
                          Cancel
                        </button>
                        <button onClick={() => { onDelete(); onClose(); }}
                          className="flex-1 py-2 rounded-lg text-sm font-mono font-semibold"
                          style={{ background: "rgba(192,57,43,0.15)", border: "1px solid rgba(192,57,43,0.4)", color: CRIT_COLOR }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDel(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono transition-all hover:scale-[1.01]"
                      style={{ background: "var(--bg-surface)", border: "1px solid rgba(192,57,43,0.2)", color: CRIT_COLOR }}>
                      <Trash2 size={14} /> Delete Story
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── CONNECTIONS TAB ──────────────────────────── */}
          {tab === "connections" && (
            <div className="space-y-3">
              {/* Existing types */}
              {connectionTypes.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                  <span className="text-lg w-6 text-center flex-shrink-0">{t.emoji}</span>
                  <div className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: t.color, boxShadow: `0 0 5px ${t.color}55` }} />
                  <span className="flex-1 text-sm font-body" style={{ color: "var(--text-secondary)" }}>
                    {t.label}
                  </span>
                  {t.isDefault ? (
                    <span className="text-xs font-mono px-2 py-0.5 rounded"
                      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
                      default
                    </span>
                  ) : (
                    <div className="relative">
                      {t.isDefault ? (
                        <span
                          className="text-xs font-mono px-2 py-0.5 rounded"
                          style={{
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-muted)",
                          }}
                        >
                          default
                        </span>
                      ) : (
                        <>
                          {pendingTypeDel !== t.id && (<button
                            onClick={() => setPendingTypeDel(t.id)}
                            className="p-1 appearance-none rounded border-0 outline-none bg-transparent hover:bg-white/10 transition-colors"
                            style={{ color: "var(--text-muted)" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = CRIT_COLOR)}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                          >
                            <Trash2 size={13} />
                          </button>)}

                          {pendingTypeDel === t.id && (
                            <div
                              className="flex items-center gap-1 px-2 py-1 rounded-lg"
                              style={{
                                background: "var(--bg-deep)",
                                border: "1px solid rgba(192,57,43,0.35)",
                                zIndex: 10,
                              }}
                            >
                              <span className="text-xs font-mono whitespace-nowrap" style={{ color: CRIT_COLOR }}>
                                Remove connections?
                              </span>

                              <button
                                onClick={() => {
                                  onRemoveConnectionType(t.id);
                                  setPendingTypeDel(null);
                                }}
                                className="inline-block text-xs font-mono rounded appearance-none outline-none p-1"
                                style={{
                                  background: "rgba(192,57,43,0.15)",
                                  color: CRIT_COLOR,
                                  borderColor: CRIT_COLOR,
                                }}
                              >
                                Yes
                              </button>

                              <button
                                onClick={() => setPendingTypeDel(null)}
                                className="inline-block text-xs font-mono rounded bg-transparent appearance-none outline-none p-1"
                                style={{
                                  color: "var(--text-muted)",
                                  borderColor: "var(--text-muted)",
                                }}
                              >
                                No
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Add new */}
              <div className="pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <p className="cl-label mb-3">Add Custom Type</p>

                {/* Emoji */}
                <div className="mb-3">
                  <label className="cl-label">Emoji</label>
                  <button onClick={() => setShowEmoji(!showEmoji)}
                    className="text-xl w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border-medium)" }}>
                    {newEmoji}
                  </button>
                  {showEmoji && (
                    <div className="mt-2 p-2 rounded-lg grid grid-cols-8 gap-1"
                      style={{ background: "var(--bg-deep)", border: "1px solid var(--border-medium)" }}>
                      {EMOJIS.map((e) => (
                        <button key={e} onClick={() => { setNewEmoji(e); setShowEmoji(false); }}
                          className="text-base w-8 h-8 rounded flex items-center justify-center border-0 outline-none bg-transparent hover:bg-white/10 transition-colors">
                          {e}
                        </button>
                      ))}
                      <input className="col-span-2 bg-transparent text-center text-sm focus:outline-none"
                        style={{ border: "1px solid var(--border-input)", color: "var(--text-primary)", borderRadius: 4 }}
                        placeholder="✍️ Custom" maxLength={2}
                        onChange={(e) => { if (e.target.value) setNewEmoji(e.target.value); }} />
                    </div>
                  )}
                </div>

                {/* Label */}
                <div className="mb-3">
                  <label className="cl-label">Label</label>
                  <input className="cl-input" placeholder="Mentor, Nemesis, Soulmate…"
                    value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addType()} />
                </div>

                {/* Color */}
                <div className="mb-4">
                  <label className="cl-label">Color</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {CON_PALETTE.map((col) => (
                      <button key={col} onClick={() => setNewColor(col)}
                        className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                        style={{
                          background: col,
                          border: newColor === col ? "2px solid var(--text-primary)" : "2px solid transparent",
                          boxShadow: newColor === col ? `0 0 8px ${col}` : "none",
                        }} />
                    ))}
                    <div className="flex gap-2 mt-1">
                      <p className={`text-sm font-mono flex items-center justify-center`} style={{ textAlign: "center", color: "var(--gold)" }}>Custom</p>
                      <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)}
                        className="w-7 h-7 rounded-full cursor-pointer border-0 p-0 bg-transparent" />
                    </div>
                  </div>
                </div>

                <button onClick={addType} disabled={!newLabel.trim()}
                  className={`w-full py-2 rounded-lg text-sm font-mono flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-40`}
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-medium)", color: "var(--gold)" }}>
                  <Plus size={14} /> Add Type
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
