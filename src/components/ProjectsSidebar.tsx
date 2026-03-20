import { useState } from "react";
import { Project } from "../lib/types";
import { BookOpen, Plus, Pencil, Trash2, Check, X, ChevronRight } from "lucide-react";
import { CRIT_COLOR, OK_COLOR } from "../lib/constants";

interface Props {
  projects: Project[];
  activeId: string;
  onSwitch: (id: string) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function ProjectsSidebar({ projects, activeId, onSwitch, onCreate, onRename, onDelete, onClose }: Props) {
  const [creatingName, setCreatingName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const submitCreate = () => {
    if (!creatingName.trim()) return;
    onCreate(creatingName.trim());
    setCreatingName("");
    setIsCreating(false);
    onClose();
  };

  const submitRename = (id: string) => {
    if (!editingName.trim()) return;
    onRename(id, editingName.trim());
    setEditingId(null);
  };

  return (
    <div className="panel-in-left projects-sidebar-responsive absolute left-0 top-0 h-full w-72 z-30 flex flex-col"
      style={{ background: "var(--panel-gradient)", borderRight: "1px solid var(--border-medium)", boxShadow: "20px 0 60px var(--shadow-lg)" }}>

      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-2">
          <BookOpen size={16} style={{ color: "var(--gold)" }} />
          <span className="font-display text-base font-semibold" style={{ color: "var(--text-primary)" }}>Your Stories</span>
        </div>
        <button onClick={onClose} style={{ color: "var(--text-muted)" }} className="p-1 appearance-none rounded border-0 outline-none bg-transparent hover:bg-white/10 transition-colors"><X size={16} /></button>
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        {projects.map((p) => (
          <div key={p.id} className="group px-3 mb-1">
            {editingId === p.id ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ background: "var(--gold-dim)", border: "1px solid var(--gold-border)" }}>
                <input
                  autoFocus
                  className="flex-1 text-sm rounded-lg px-3 py-2 transition-all"
                  style={{
                    background: "var(--bg-surface)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-medium)",
                    fontFamily: "'Crimson Pro', serif",
                    outline: "none",
                    boxShadow: "none",
                  }}
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitRename(p.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                />
                <button onClick={() => submitRename(p.id)} style={{ color: OK_COLOR }} className="appearance-none rounded border-0 outline-none bg-transparent hover:bg-white/10 transition-colors"><Check size={13} /></button>
                <button onClick={() => setEditingId(null)} style={{ color: CRIT_COLOR }} className="appearance-none rounded border-0 outline-none bg-transparent hover:bg-white/10 transition-colors"><X size={13} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
                style={{
                  background: p.id === activeId ? "var(--gold-dim)" : "transparent",
                  border: p.id === activeId ? "1px solid var(--gold-border)" : "1px solid transparent",
                }}
                onClick={() => { onSwitch(p.id); onClose(); }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: p.id === activeId ? "var(--gold)" : "var(--gold-border)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={{ color: p.id === activeId ? "var(--text-primary)" : "var(--text-secondary)" }}>
                    {p.name}
                  </p>
                  <p className="text-xs font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {new Date(p.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </p>
                </div>
                {p.id === activeId && <ChevronRight size={12} style={{ color: "var(--gold)", flexShrink: 0 }} />}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); setEditingId(p.id); setEditingName(p.name); }}
                    className="p-1 appearance-none rounded border-0 outline-none bg-transparent hover:bg-white/10 transition-colors"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
                    <Pencil size={11} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="px-4 py-4 flex-shrink-0" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        {isCreating ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-medium)" }}>
            <input autoFocus
              className="flex-1 text-sm rounded-lg px-3 py-2 transition-all"
              style={{
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-medium)",
                fontFamily: "'Crimson Pro', serif",
                outline: "none",
                boxShadow: "none",
              }}
              placeholder="Story name…" value={creatingName}
              onChange={(e) => setCreatingName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submitCreate(); if (e.key === "Escape") setIsCreating(false); }} />
            <button onClick={submitCreate} style={{ color: OK_COLOR }} className="appearance-none rounded border-0 outline-none bg-transparent hover:bg-white/10 transition-colors"><Check size={14} /></button>
            <button onClick={() => setIsCreating(false)} style={{ color: CRIT_COLOR }} className="appearance-none rounded border-0 outline-none bg-transparent hover:bg-white/10 transition-colors"><X size={14} /></button>
          </div>
        ) : (
          <button onClick={() => setIsCreating(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-sm transition-all hover:scale-[1.02]"
            style={{ background: "var(--gold-dim)", border: "1px dashed var(--gold-border)", color: "var(--gold)" }}>
            <Plus size={14} /> New Story
          </button>
        )}
      </div>
    </div>
  );
}
