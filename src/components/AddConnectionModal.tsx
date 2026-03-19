import { useState } from "react";
import { Character, Connection, ConnectionType } from "../lib/types";
import { X, Link, ArrowLeftRight, ArrowRight } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface Props {
  characters: Character[];
  connectionTypes: ConnectionType[];
  onAdd: (connection: Connection) => void;
  onClose: () => void;
}

export default function AddConnectionModal({ characters, connectionTypes, onAdd, onClose }: Props) {
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [label, setLabel]   = useState("");
  const [type, setType]     = useState(connectionTypes[0]?.id ?? "friendship");
  const [mutual, setMutual] = useState(false);

  const normalize = (s: string) => {
    const t = s.trim().slice(0, 15);
    return t.charAt(0).toUpperCase() + t.slice(1);
  };

  const submit = () => {
    if (!source || !target || source === target || !label.trim()) return;
    onAdd({ id: uuidv4(), source, target, label: normalize(label), type, mutual });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "var(--overlay)" }}>
      <div className="w-full max-w-sm rounded-xl overflow-hidden fade-in"
        style={{ background: "var(--panel-gradient)", border: "1px solid var(--border-medium)", boxShadow: "0 40px 80px var(--shadow-xl)" }}>

        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <h3 className="font-display text-lg font-semibold" style={{ color: "var(--text-primary)" }}>New Connection</h3>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}><X size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* From / Mutual toggle / To */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="cw-label">From</label>
              <select className="cw-select" value={source} onChange={(e) => setSource(e.target.value)}>
                <option value="">Select…</option>
                {characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col items-center gap-1 pb-0.5">
              <span className="cw-label">Mutual</span>
              <button onClick={() => setMutual(!mutual)}
                className="w-10 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                style={{ background: mutual ? "var(--gold-dim)" : "var(--bg-surface)", border: `1px solid ${mutual ? "var(--gold-border)" : "var(--border-medium)"}`, color: mutual ? "var(--gold)" : "var(--text-muted)" }}>
                {mutual ? <ArrowLeftRight size={16} /> : <ArrowRight size={16} />}
              </button>
            </div>
            <div className="flex-1">
              <label className="cw-label">To</label>
              <select className="cw-select" value={target} onChange={(e) => setTarget(e.target.value)}>
                <option value="">Select…</option>
                {characters.filter((c) => c.id !== source).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="cw-label">
              Label <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({label.length}/15)</span>
            </label>
            <input className="cw-input" placeholder="Married, Rivals…" maxLength={15}
              value={label}
              onChange={(e) => {
                const v = e.target.value.slice(0, 15);
                setLabel(v.charAt(0).toUpperCase() + v.slice(1));
              }}
              onKeyDown={(e) => e.key === "Enter" && submit()} />
          </div>

          <div>
            <label className="cw-label mb-2">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {connectionTypes.map((t) => (
                <button key={t.id} onClick={() => setType(t.id)}
                  className="py-2 px-3 rounded-lg text-sm font-mono text-left flex items-center gap-2 transition-all"
                  style={{
                    background: type === t.id ? "var(--gold-dim)" : "var(--bg-surface)",
                    border: type === t.id ? `1px solid ${t.color}80` : "1px solid var(--border-subtle)",
                    color: type === t.id ? t.color : "var(--text-muted)",
                  }}>
                  <span>{t.emoji}</span> {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <button onClick={onClose} className="px-4 py-2 text-sm font-mono" style={{ color: "var(--text-muted)" }}>Cancel</button>
          <button onClick={submit} disabled={!source || !target || source === target || !label.trim()}
            className="px-5 py-2 rounded-lg text-sm font-mono flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, var(--text-muted), var(--gold))", color: "var(--bg-deep)", fontWeight: 600 }}>
            <Link size={14} /> Connect
          </button>
        </div>
      </div>
    </div>
  );
}
