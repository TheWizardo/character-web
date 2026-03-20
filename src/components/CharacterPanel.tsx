import { useEffect, useState } from "react";
import { Character, Connection, ConnectionType } from "../lib/types";
import {
  X, MapPin, Briefcase, GraduationCap, Heart, Edit3, Check,
  Trash2, User, ArrowLeftRight, ArrowRight, Calendar, FileText, AlertTriangle
} from "lucide-react";
import { CHAR_PALLETE, CRIT_COLOR, DEF_COLOR, OK_COLOR } from "../lib/constants";

interface Props {
  character: Character;
  connections: Connection[];
  allCharacters: Character[];
  connectionTypes: ConnectionType[];
  onClose: () => void;
  onUpdate: (updated: Character) => void;
  onDelete: (id: string) => void;
  onDeleteConnection: (connId: string) => void;
}

export default function CharacterPanel({
  character, connections, allCharacters, connectionTypes,
  onClose, onUpdate, onDelete, onDeleteConnection,
}: Props) {

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Character>(character);
  const [confirmDelete, setConfirm] = useState(false);
  const [pendingConnDel, setPendingConn] = useState<string | null>(null);
  const [newColor, setNewColor] = useState(CHAR_PALLETE[0]);

  useEffect(() => {
    setDraft(character);
    setEditing(false);
    setConfirm(false);
    setPendingConn(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character.id]);

  const related = connections.filter(
    (c) => c.source === character.id || c.target === character.id
  );

  const getOther = (conn: Connection) =>
    allCharacters.find((c) => c.id === (conn.source === character.id ? conn.target : conn.source));

  const typeDisplay = (typeId: string) => {
    const t = connectionTypes.find((ct) => ct.id === typeId);
    return t ? `${t.emoji} ${t.label}` : typeId;
  };

  const save = () => { onUpdate(draft); setEditing(false); };

  // ── Delete confirmation ───────────────────────────────
  if (confirmDelete) {
    return (
      <div className="panel-in character-panel-responsive flex flex-col h-full w-full sm:w-[420px]"
        style={{ background: "var(--panel-gradient)", borderLeft: "1px solid var(--border-subtle)", boxShadow: "-20px 0 60px var(--shadow-lg)" }}>
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-10 text-center scale-in">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
            style={{ background: "rgba(192,57,43,0.12)", border: "1px solid rgba(192,57,43,0.35)" }}>
            <AlertTriangle size={24} style={{ color: CRIT_COLOR }} />
          </div>
          <h3 className="font-display text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            Delete {character.name}?
          </h3>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            This character will be permanently removed.
          </p>
          {related.length > 0 && (
            <div className="w-full mb-6 text-left rounded-lg p-3"
              style={{ background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.2)" }}>
              <p className="text-xs font-mono mb-2" style={{ color: CRIT_COLOR }}>
                {related.length} connection{related.length !== 1 ? "s" : ""} will also be removed:
              </p>
              <div className="space-y-1.5">
                {related.map((conn) => {
                  const other = getOther(conn);
                  return (
                    <div key={conn.id} className="flex items-center gap-2">
                      <span className="text-sm">{typeDisplay(conn.type).split(" ")[0]}</span>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{conn.label}</span>
                      {other && <span className="font-mono text-xs ml-auto" style={{ color: "var(--text-muted)" }}>↔ {other.name}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex gap-3 w-full">
            <button onClick={() => setConfirm(false)}
              className="flex-1 py-2.5 rounded-lg font-mono text-sm transition-all hover:scale-105"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-medium)", color: "var(--text-muted)" }}>
              Cancel
            </button>
            <button onClick={() => onDelete(character.id)}
              className="flex-1 py-2.5 rounded-lg font-mono text-sm font-semibold transition-all hover:scale-105"
              style={{ background: "rgba(192,57,43,0.15)", border: "1px solid rgba(192,57,43,0.4)", color: CRIT_COLOR }}>
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main panel ────────────────────────────────────────
  return (
    <div className="panel-in character-panel-responsive flex flex-col h-full w-full sm:w-[420px]"
      style={{ background: "var(--panel-gradient)", borderLeft: "1px solid var(--border-subtle)", boxShadow: "-20px 0 60px var(--shadow-lg)" }}>

      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-6 pb-4 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-display font-semibold text-lg flex-shrink-0"
            style={{ background: `${character.color || DEF_COLOR}22`, border: `2px solid ${character.color || DEF_COLOR}`, color: character.color || "var(--gold)" }}>
            {character.name[0]}
          </div>
          <div>
            {editing
              ? <input className="bg-transparent font-display text-xl font-semibold focus:outline-none w-44 pb-0.5"
                style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--gold-border)" }}
                value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              : <h2 className="font-display text-xl font-semibold" style={{ color: "var(--text-primary)" }}>{character.name}</h2>
            }
            <p className="text-xs font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>
              {related.length} connection{related.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {editing
            ? <button onClick={save} className="p-2 appearance-none rounded border-0 outline-none bg-transparent hover:bg-white/10 transition-colors" style={{ color: OK_COLOR }}><Check size={16} /></button>
            : <button onClick={() => setEditing(true)} className="p-2 appearance-none rounded border-0 outline-none bg-transparent hover:bg-white/10 transition-colors" style={{ color: "var(--text-muted)" }} title="Edit"><Edit3 size={16} /></button>
          }
          <button onClick={() => setConfirm(true)} className="p-2 appearance-none rounded border-0 outline-none bg-transparent hover:bg-white/10 transition-colors" style={{ color: "var(--text-muted)" }} title="Delete"><Trash2 size={16} /></button>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }} className="p-2 appearance-none rounded border-0 outline-none bg-transparent hover:bg-white/10 transition-colors"><X size={16} /></button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">

        {/* Color picker */}
        {editing && (
          <div className="mb-5">
            <label className="cl-label">Color</label>
            <div className="flex gap-2 flex-wrap mt-1">
              {CHAR_PALLETE.map((col) => (
                <button key={col} onClick={() => setDraft({ ...draft, color: col })}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{ background: col, border: draft.color === col ? "2px solid var(--text-primary)" : "2px solid transparent", boxShadow: draft.color === col ? `0 0 8px ${col}` : "none" }} />
              ))}
            </div>
          </div>
        )}

        {/* Full name */}
        <F label="Full Name" editing={editing}>
          {editing
            ? <input className="cl-input" value={draft.fullName} onChange={(e) => setDraft({ ...draft, fullName: e.target.value })} />
            : <Val>{character.fullName}</Val>}
        </F>

        {/* Age + Birthdate */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <F label="Age" editing={editing}>
            {editing
              ? <input type="number" className="cl-input" value={draft.age || ""}
                onChange={(e) => setDraft({ ...draft, age: parseInt(e.target.value) || undefined })} />
              : <Val>{character.age?.toString()}</Val>}
          </F>
          <F label="Birthdate" icon={<Calendar size={10} />} editing={editing}>
            {editing
              ? <input type="date" className="cl-input" value={draft.birthDate || ""}
                onChange={(e) => setDraft({ ...draft, birthDate: e.target.value })} />
              : <Val>{character.birthDate
                ? new Date(character.birthDate + "T00:00:00").toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
                : undefined}</Val>}
          </F>
        </div>

        {/* Physical description */}
        <F label="Physical Description" icon={<User size={10} />} editing={editing}>
          {editing
            ? <textarea className="cl-input" rows={3} style={{ resize: "none" }} value={draft.physicalDescription}
              onChange={(e) => setDraft({ ...draft, physicalDescription: e.target.value })} />
            : <Val multiline>{character.physicalDescription}</Val>}
        </F>

        {/* Hobbies */}
        <F label="Hobbies" icon={<Heart size={10} />} editing={editing}>
          {editing
            ? <input className="cl-input" placeholder="Comma-separated" value={draft.hobbies.join(", ")}
              onChange={(e) => setDraft({ ...draft, hobbies: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
            : character.hobbies.length > 0
              ? <div className="flex flex-wrap gap-1.5">
                {character.hobbies.map((h, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full font-mono"
                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                    {h}
                  </span>
                ))}
              </div>
              : <Val>{undefined}</Val>}
        </F>

        <F label="Address" icon={<MapPin size={10} />} editing={editing}>
          {editing
            ? <input className="cl-input" value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
            : <Val>{character.address}</Val>}
        </F>

        <F label="Workplace" icon={<Briefcase size={10} />} editing={editing}>
          {editing
            ? <input className="cl-input" value={draft.workplace} onChange={(e) => setDraft({ ...draft, workplace: e.target.value })} />
            : <Val>{character.workplace}</Val>}
        </F>

        <F label="Education" icon={<GraduationCap size={10} />} editing={editing}>
          {editing
            ? <input className="cl-input" value={draft.education} onChange={(e) => setDraft({ ...draft, education: e.target.value })} />
            : <Val>{character.education}</Val>}
        </F>

        <F label="Additional Information" icon={<FileText size={10} />} editing={editing}>
          {editing
            ? <textarea className="cl-input" rows={4} style={{ resize: "vertical" }}
              placeholder="Backstory, secrets, arcs…"
              value={draft.additionalInfo || ""}
              onChange={(e) => setDraft({ ...draft, additionalInfo: e.target.value })} />
            : <Val multiline>{character.additionalInfo}</Val>}
        </F>

        {/* Connections */}
        {related.length > 0 && (
          <div className="mt-6 pt-5" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <label className="cl-label">Connections</label>
            <div className="space-y-2 mt-2">
              {related.map((conn) => {
                const other = getOther(conn);
                if (!other) return null;
                const isSource = conn.source === character.id;
                return (
                  <div key={conn.id} className="flex items-center gap-3 p-2.5 rounded-lg group relative"
                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-display font-semibold flex-shrink-0"
                      style={{ background: `${other.color || DEF_COLOR}22`, border: `1.5px solid ${other.color || DEF_COLOR}`, color: other.color || "var(--gold)" }}>
                      {other.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-body truncate" style={{ color: "var(--text-secondary)" }}>{other.name}</p>
                      <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{conn.label}</p>
                    </div>
                    <span style={{ color: "var(--text-muted)" }} title={conn.mutual ? "Mutual" : isSource ? "Outgoing" : "Incoming"}>
                      {conn.mutual
                        ? <ArrowLeftRight size={11} />
                        : isSource
                          ? <ArrowRight size={11} />
                          : <ArrowRight size={11} style={{ transform: "rotate(180deg)" }} />}
                    </span>
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{ background: "var(--bg-surface)", color: "var(--text-muted)" }}>
                      {typeDisplay(conn.type).split(" ")[0]}
                    </span>
                    <button
                      onClick={() => setPendingConn(conn.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded flex-shrink-0"
                      style={{ color: "var(--text-muted)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = CRIT_COLOR)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                      title="Delete connection">
                      <Trash2 size={12} />
                    </button>
                    {/* Inline confirm */}
                    {pendingConnDel === conn.id && (
                      <div className="absolute right-0 top-0 h-full flex items-center gap-1 px-2 rounded-lg"
                        style={{ background: "var(--bg-deep)", border: "1px solid rgba(192,57,43,0.35)", zIndex: 10 }}>
                        <span className="text-xs font-mono" style={{ color: CRIT_COLOR }}>Remove?</span>
                        <button onClick={() => { onDeleteConnection(conn.id); setPendingConn(null); }}
                          className="text-xs font-mono px-1.5 py-0.5 rounded"
                          style={{ background: "rgba(192,57,43,0.15)", color: CRIT_COLOR }}>Yes</button>
                        <button onClick={() => setPendingConn(null)}
                          className="text-xs font-mono px-1.5 py-0.5 rounded"
                          style={{ color: "var(--text-muted)" }}>No</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tiny helpers ─────────────────────────────────────────
function F({ label, icon, editing, children }: { label: string; icon?: React.ReactNode; editing: boolean; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="cl-label flex items-center gap-1">
        {icon}{label}
      </label>
      {children}
    </div>
  );
}

function Val({ children, multiline, italic }: { children?: string | null; multiline?: boolean; italic?: boolean }) {
  if (!children) return <p style={{ color: "var(--text-muted)", fontSize: 14, fontStyle: "italic" }}>Not set</p>;
  return (
    <p style={{
      color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.65,
      fontStyle: italic ? "italic" : "normal", opacity: italic ? 0.8 : 1,
      whiteSpace: multiline ? "pre-wrap" : "normal",
    }}>
      {children}
    </p>
  );
}
