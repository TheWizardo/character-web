import React, { useState, useMemo, useEffect } from "react";
import { Project, ConnectionType } from "../../lib/types";
import { X, RotateCcw, Trash2, AlertTriangle, Plus, Settings, Link, Download, CloudUpload, Share, Check, Copy } from "lucide-react";
import { downloadChrl } from "../../lib/chrl";
import { CON_PALETTE, CRIT_COLOR, EMOJIS, GUEST_KEY, OK_COLOR } from "../../lib/constants";
import { uploadProject } from "../../lib/cloudStorage";
import { useNotifications } from "../../hooks/useNotifications";
import { v4 as uuidv4 } from "uuid";
import { useAppState } from "../../hooks/useAppState";
import ToggleBtn from "../interface/ToggleBtn";
import { capitalize } from "../../lib/helpers";

type TabTag = "general" | "connections" | "share";
type Tab = {
  id: TabTag,
  Icon: typeof Settings,
  name: string
}

interface Props {
  project: Project;
  canDelete: boolean;
  connectionTypes: ConnectionType[];
  characterCount: number;
  connectionCount: number;
  onReset: () => void;
  onDelete: () => void;
  onSaveCb: (p: Project) => Project;
  onAddConnectionType: (types: ConnectionType) => void;
  onRemoveConnectionType: (id: string) => void;
  onClose: () => void;
}

const TABS: Tab[] = [
  {
    id: "general",
    Icon: Settings,
    name: "General"
  }, {
    id: "connections",
    Icon: Link,
    name: "Connections"
  }, {
    id: "share",
    Icon: Share,
    name: "Share"
  }
]

function isSingleEmoji(value: string): boolean {
  const v = value.trim();

  if (!v) return false;

  // Match one emoji grapheme-like unit, including most composed emoji
  const emojiRegex = /^(?:\p{Emoji_Presentation}|\p{Extended_Pictographic})(?:\uFE0F)?(?:\u200D(?:\p{Emoji_Presentation}|\p{Extended_Pictographic})(?:\uFE0F)?)*$/u;

  return emojiRegex.test(v);
}


const getRandomType = (cts: ConnectionType[]) => {
  const { colors, emojis } = getAvailableConnectionTypes(cts);
  return { label: "", color: colors[Math.floor(Math.random() * colors.length)], emoji: emojis[Math.floor(Math.random() * emojis.length)] }
}

const getAvailableConnectionTypes = (cts: ConnectionType[]) => {
  const existingColors = cts.map(ct => ct.color);
  const existingEmojis = cts.map(ct => ct.emoji);
  const colors = CON_PALETTE.filter(c => !existingColors.includes(c));
  const emojis = EMOJIS.filter(e => !existingEmojis.includes(e));
  return { colors, emojis };
}

export default function ProjectSettingsModal({
  project, canDelete, connectionTypes, characterCount, connectionCount,
  onSaveCb, onReset, onDelete, onAddConnectionType, onRemoveConnectionType, onClose
}: Props) {
  const [form, setForm] = useState<Omit<ConnectionType, "id"> & { isDirty: boolean, errors?: { label?: string, emoji?: string } }>({ ...getRandomType(connectionTypes), isDirty: false });
  const [tab, setTab] = useState<TabTag>("general");
  const [name, setName] = useState(project.name);
  const [publicity, setPublicity] = useState<boolean>(project.isPublic);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [pendingTypeDel, setPendingTypeDel] = useState<string | null>(null);
  const [availableEmojis, setAvailableEmojis] = useState<string[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>([]);

  const [showEmoji, setShowEmoji] = useState(false);

  const [copied, setCopied] = useState(false);

  const notify = useNotifications();
  const { userId } = useAppState();


  const updateRoster = () => {
    const { colors, emojis } = getAvailableConnectionTypes(connectionTypes);
    setAvailableColors(colors);
    setAvailableEmojis(emojis);
  }

  useEffect(updateRoster, [connectionTypes]);

  const publicUrl = useMemo(() => {
    return `https://character-loom.com/share/${userId}/${project.id}`;
  }, [project.id, userId]);

  const copyPublicUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      notify.error("Failed to copy link");
    }
  };

  const saveDetails = () => {
    const updatedProject: Project = { ...project, name: name.trim(), isPublic: publicity ? true : undefined };
    uploadProject(userId, { p: onSaveCb(updatedProject) })
      .then(ok => {
        if (ok) {
          notify.success(`Uploaded "${project.name}"`);
        }
        else {
          notify.error(`Unable to uploaded "${project.name}"`);
        }
      });
  };

  const evaluateForm = (
    f: Omit<ConnectionType, "id"> & {
      isDirty: boolean;
      errors?: { label?: string; emoji?: string };
    }
  ) => {
    const errors: { label?: string; emoji?: string } = {};
    if (!f.label.trim()) {
      errors.label = "Type must have a label";
    }
    if (!f.emoji.trim()) {
      errors.emoji = "Type must have an emoji";
    } else if (!isSingleEmoji(f.emoji)) {
      errors.emoji = "Enter a single emoji";
    }

    const newForm = { ...f, errors };
    if (!errors.label && !errors.emoji) {
      delete newForm.errors;
    }
    setForm(newForm);
    return newForm;
  };

  const addType = (e?: React.FormEvent) => {
    e?.preventDefault();
    const newForm = evaluateForm(form);
    if (newForm.errors) {
      setForm({ ...newForm, isDirty: true });
      return;
    }

    const id = "custom-" + form.label + uuidv4().slice(0, 4);
    const newType: ConnectionType = {
      id,
      label: form.label,
      color: form.color,
      emoji: form.emoji,
      isDefault: false
    };
    onAddConnectionType(newType)
    const newConnectionTypes = [...connectionTypes, newType];
    const { emojis, colors } = getAvailableConnectionTypes(newConnectionTypes)
    setAvailableColors(colors);
    setAvailableEmojis(emojis);
    setForm({ ...getRandomType(newConnectionTypes), isDirty: false });
    setShowEmoji(false);
  };

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
            <div className="flex items-center gap-2 flex-wrap">
              <h2
                className="font-display text-lg font-semibold leading-none m-0"
                style={{ color: "var(--text-primary)" }}
              >
                Story Settings
              </h2>

              <span
                aria-hidden="true"
                className="leading-none"
                style={{ color: "var(--text-muted)" }}
              >
                |
              </span>

              <span
                className="text-sm leading-none"
                style={{
                  color: "var(--text-muted)",
                  fontFamily: "'DM Mono', monospace",
                  fontWeight: 400,
                  marginTop: "0.02em",
                }}
              >
                {project.name}
              </span>
            </div>
            <p className="font-mono text-xs" style={{ color: "var(--text-muted)", marginTop: 2 }}>
              {characterCount} character{characterCount !== 1 ? "s" : ""} · {connectionCount} connection{connectionCount !== 1 ? "s" : ""}
            </p>
          </div>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }} className="appearance-none rounded border-0 outline-none bg-transparent hover:bg-white/10 transition-colors"><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-3 gap-1.5 flex-shrink-0 mb-2">
          {TABS.map(({ id, Icon, name }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-1 ${tab === id ? "px-5" : ""} py-2 text-sm font-mono rounded-lg transition-all`}
              style={{
                background: tab === id ? "var(--gold-dim)" : "transparent",
                border: `1px solid ${tab === id ? "var(--gold-border)" : "transparent"}`,
                color: tab === id ? "var(--gold)" : "var(--text-muted)",
              }}>
              <Icon size={13} /> {name}
            </button>
          ))}
        </div>

        <div style={{
          height: 0,
          width: "97.5%",
          margin: "0 auto",
          border: "1px solid var(--text-muted)",
          borderStyle: "dashed",
        }} />

        {/* Tab body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {/* ── GENERAL TAB ──────────────────────────────── */}
          {tab === "general" && (
            <div className="space-y-5">

              {/* isPublic */}
              < ToggleBtn label="Public project" state={publicity} setState={setPublicity} />

              {/* Name */}
              <div>
                <label className="cl-label">Story Name</label>
                <input className="cl-input flex-1" value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveDetails()} />
              </div>

              {/* Upload */}
              <button
                disabled={userId === GUEST_KEY}
                onClick={saveDetails}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-mono transition-all ${userId === GUEST_KEY ? "" : "hover:scale-[1.01]"}`}
                style={{
                  background: "linear-gradient(135deg, var(--text-muted), var(--gold))",
                  color: "var(--bg-deep)",
                  border: "1px solid var(--gold-border)",
                  fontWeight: 600,
                }}
              >
                <CloudUpload size={18} />
                {userId === GUEST_KEY ? "Login to upload" : "Save & Upload"}
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
              <form
                className="pt-3"
                style={{ borderTop: "1px solid var(--border-subtle)" }}
                onSubmit={addType}
              >
                <p className="cl-label mb-3">Add Custom Type</p>

                {/* Emoji */}
                <div className="mb-3">
                  <label className="cl-label">Emoji</label>
                  <button
                    type="button"
                    onClick={() => setShowEmoji(!showEmoji)}
                    className="text-xl w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                    style={{
                      background: "var(--bg-surface)",
                      border: `1px solid ${form.isDirty && form.errors?.emoji ? CRIT_COLOR : "var(--border-medium)"}`,
                    }}
                    title={form.isDirty ? form.errors?.emoji : ""}
                  >
                    {form.emoji}
                  </button>

                  {showEmoji && (
                    <div
                      className="mt-2 p-2 rounded-lg grid grid-cols-8 gap-1"
                      style={{
                        background: "var(--bg-deep)",
                        border: `1px solid ${form.isDirty && form.errors?.emoji ? CRIT_COLOR : "var(--border-medium)"}`,
                      }}
                    >
                      {availableEmojis.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => {
                            evaluateForm({ ...form, emoji: e });
                            setShowEmoji(false);
                          }}
                          className="text-base w-8 h-8 rounded flex items-center justify-center border-0 outline-none bg-transparent hover:bg-white/10 transition-colors"
                        >
                          {e}
                        </button>
                      ))}

                      <input
                        className="col-span-2 bg-transparent text-center text-sm focus:outline-none"
                        style={{
                          border: `1px solid ${form.isDirty && form.errors?.emoji ? CRIT_COLOR : "var(--border-input)"}`,
                          color: "var(--text-primary)",
                          borderRadius: 4,
                        }}
                        title={form.isDirty ? form.errors?.emoji : ""}
                        placeholder="✍️ Custom"
                        maxLength={8}
                        value={availableEmojis.includes(form.emoji) ? "" : form.emoji}
                        onChange={(e) => {
                          evaluateForm({ ...form, emoji: e.target.value });
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Label */}
                <div className="mb-3">
                  <label className="cl-label">Label</label>
                  <input
                    className="cl-input"
                    placeholder="Mentor, Nemesis, Soulmate…"
                    value={form.label}
                    onChange={(e) => evaluateForm({ ...form, label: capitalize(e.target.value) })}
                    style={{
                      border: `1px solid ${form.isDirty && form.errors?.label ? CRIT_COLOR : "var(--border-medium)"}`,
                    }}
                    title={form.isDirty ? form.errors?.label : ""}
                  />
                </div>

                {/* Color */}
                <div className="mb-4">
                  <label className="cl-label">Color</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {availableColors.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => evaluateForm({ ...form, color: col })}
                        className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                        style={{
                          background: col,
                          border: form.color === col ? "2px solid var(--text-primary)" : "2px solid transparent",
                          boxShadow: form.color === col ? `0 0 8px ${col}` : "none",
                        }}
                      />
                    ))}

                    <div className="flex gap-2 mt-1">
                      <p
                        className="text-sm font-mono flex items-center justify-center"
                        style={{ textAlign: "center", color: "var(--gold)" }}
                      >
                        Custom
                      </p>
                      <input
                        type="color"
                        value={form.color}
                        onChange={(e) => evaluateForm({ ...form, color: e.target.value })}
                        className="w-7 h-7 rounded-full cursor-pointer border-0 p-0 bg-transparent"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-lg text-sm font-mono flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-40"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-medium)",
                    color: "var(--gold)",
                  }}
                >
                  <Plus size={14} /> Add Type
                </button>
              </form>
            </div>
          )}

          {/* ── SHARE TAB ────────────────────────────────── */}
          {tab === "share" && (
            project.isPublic === true ? (
              <div className="space-y-3">

                {/* Share */}
                <div>
                  <p className="cl-label mb-3">Share Link</p>
                  <div
                    className="flex items-stretch"
                  >
                    <input
                      readOnly
                      value={publicUrl}
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
                      onClick={copyPublicUrl}
                      aria-label={copied ? "Copied" : "Copy link"}
                      className="relative w-11 transition-all duration-200 active:scale-95"
                      style={{
                        background: copied ? "rgba(46, 204, 113, 0.14)" : "var(--gold-border)",
                        border: copied
                          ? "1px solid rgba(46, 204, 113, 0.35)"
                          : "1px solid var(--gold-border)",
                        color: copied ? OK_COLOR : "var(--gold)",
                        borderTopRightRadius: 8,
                        borderBottomRightRadius: 8
                      }}
                    >
                      <span
                        className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${copied ? "opacity-0 scale-75" : "opacity-100 scale-100"
                          }`}
                      >
                        <Copy size={16} />
                      </span>

                      <span
                        className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${copied ? "opacity-100 scale-100" : "opacity-0 scale-75"
                          }`}
                      >
                        <Check size={17} strokeWidth={2.5} />
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <h4
                className="font-display text-lg font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                This project is not a public project.
                <br />
                If you wish to share it with others, set it to public on the 'General' tab
              </h4>
            ))}
        </div>
      </div >
    </div >
  );
}
