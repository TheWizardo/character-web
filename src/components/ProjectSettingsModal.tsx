import { useState } from "react";
import { Project, ConnectionType } from "../lib/types";
import { X, Check, RotateCcw, Trash2, AlertTriangle, Plus, Settings, Link, Download } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { downloadChrw } from "../lib/storage";
import { GraphData } from "../lib/types";

type Tab = "general" | "connections";

const PALETTE = [
  "#e84393","#e67e22","#27ae60","#c0392b","#2980b9","#8b6f47",
  "#8e44ad","#16a085","#d4a843","#2c3e50","#e74c3c","#1abc9c",
];
const EMOJIS = [
  "💕","🏠","🤝","⚔️","💼","🔗","🌹","👑","🗡️","🌿","🔥","❄️",
  "🎭","🪄","🧪","📜","🕊️","🐍","💀","⚡","🌊","🌙","☀️","🎯",
];

interface Props {
  project: Project;
  canDelete: boolean;
  connectionTypes: ConnectionType[];
  characterCount: number;
  connectionCount: number;
  projectData: GraphData;
  onRename: (name: string) => void;
  onReset: () => void;
  onDelete: () => void;
  onSaveConnectionTypes: (types: ConnectionType[]) => void;
  onClose: () => void;
}

export default function ProjectSettingsModal({
  project, canDelete, connectionTypes, characterCount, connectionCount, projectData,
  onRename, onReset, onDelete, onSaveConnectionTypes, onClose,
}: Props) {
  const [tab, setTab]                   = useState<Tab>("general");
  const [name, setName]                 = useState(project.name);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDel, setConfirmDel]     = useState(false);

  // Connection types state
  const [ctDraft, setCtDraft]           = useState<ConnectionType[]>(connectionTypes);
  const [newLabel, setNewLabel]         = useState("");
  const [newEmoji, setNewEmoji]         = useState("🔗");
  const [newColor, setNewColor]         = useState(PALETTE[0]);
  const [showEmoji, setShowEmoji]       = useState(false);
  const [ctDirty, setCtDirty]           = useState(false);

  const saveRename = () => {
    if (name.trim() && name.trim() !== project.name) onRename(name.trim());
  };

  const addType = () => {
    if (!newLabel.trim()) return;
    const id = "custom-" + uuidv4().slice(0, 8);
    const next = [...ctDraft, { id, label: newLabel.trim(), emoji: newEmoji, color: newColor, isDefault: false }];
    setCtDraft(next);
    setCtDirty(true);
    setNewLabel(""); setNewEmoji("🔗");
    setNewColor(PALETTE[Math.floor(Math.random() * PALETTE.length)]);
    setShowEmoji(false);
  };

  const removeType = (id: string) => {
    setCtDraft(ctDraft.filter((t) => t.id !== id));
    setCtDirty(true);
  };

  const saveTypes = () => {
    onSaveConnectionTypes(ctDraft);
    setCtDirty(false);
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
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-3 gap-1 flex-shrink-0">
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
                <label className="cw-label">Story Name</label>
                <div className="flex gap-2">
                  <input className="cw-input flex-1" value={name}
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

              {/* Export */}
              <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 16 }}>
                <button
                  onClick={() => downloadChrw(project, projectData)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono transition-all hover:scale-[1.01]"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                  <Download size={14} style={{ color: "var(--gold)", flexShrink: 0 }} />
                  <div className="text-left">
                    <p>Export Story</p>
                    <p className="text-xs opacity-60 mt-0.5">Downloads a .chrw file</p>
                  </div>
                </button>
              </div>

              {/* Reset */}
              <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 16 }}>
                {confirmReset ? (
                  <div className="rounded-lg p-4"
                    style={{ background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.25)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={14} style={{ color: "#c0392b" }} />
                      <p className="text-sm font-mono" style={{ color: "#c0392b" }}>
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
                        style={{ background: "rgba(192,57,43,0.15)", border: "1px solid rgba(192,57,43,0.4)", color: "#c0392b" }}>
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
                      <p className="text-sm font-mono mb-3" style={{ color: "#c0392b" }}>
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
                          style={{ background: "rgba(192,57,43,0.15)", border: "1px solid rgba(192,57,43,0.4)", color: "#c0392b" }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDel(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono transition-all hover:scale-[1.01]"
                      style={{ background: "var(--bg-surface)", border: "1px solid rgba(192,57,43,0.2)", color: "#c0392b" }}>
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
              {ctDraft.map((t) => (
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
                    <button onClick={() => removeType(t.id)}
                      className="p-1 rounded transition-colors"
                      style={{ color: "var(--text-muted)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#c0392b")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}

              {/* Add new */}
              <div className="pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <p className="cw-label mb-3">Add Custom Type</p>

                {/* Emoji */}
                <div className="mb-3">
                  <label className="cw-label">Emoji</label>
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
                          className="text-base w-8 h-8 rounded flex items-center justify-center transition-colors hover:bg-white/10">
                          {e}
                        </button>
                      ))}
                      <input className="col-span-2 bg-transparent text-center text-sm focus:outline-none"
                        style={{ border: "1px solid var(--border-input)", color: "var(--text-primary)", borderRadius: 4 }}
                        placeholder="✍️" maxLength={2}
                        onChange={(e) => { if (e.target.value) setNewEmoji(e.target.value); }} />
                    </div>
                  )}
                </div>

                {/* Label */}
                <div className="mb-3">
                  <label className="cw-label">Label</label>
                  <input className="cw-input" placeholder="Mentor, Nemesis, Soulmate…"
                    value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addType()} />
                </div>

                {/* Color */}
                <div className="mb-4">
                  <label className="cw-label">Color</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {PALETTE.map((col) => (
                      <button key={col} onClick={() => setNewColor(col)}
                        className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                        style={{
                          background: col,
                          border: newColor === col ? "2px solid var(--text-primary)" : "2px solid transparent",
                          boxShadow: newColor === col ? `0 0 8px ${col}` : "none",
                        }} />
                    ))}
                    <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)}
                      className="w-7 h-7 rounded-full cursor-pointer border-0 p-0 bg-transparent" />
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

        {/* Footer — save button only on connections tab when dirty */}
        {tab === "connections" && ctDirty && (
          <div className="px-6 py-4 flex justify-end flex-shrink-0"
            style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <button onClick={saveTypes}
              className={`${btnBase} hover:scale-105`}
              style={{ background: "linear-gradient(135deg, var(--text-muted), var(--gold))", color: "var(--bg-deep)", fontWeight: 600 }}>
              <Check size={14} /> Save Types
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
