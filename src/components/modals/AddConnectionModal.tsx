import { useEffect, useMemo, useState } from "react";
import { Character, Connection, ConnectionType } from "../../lib/types";
import { X, Link, ArrowLeftRight, ArrowRight } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface Props {
  characters: Character[];
  connectionTypes: ConnectionType[];
  onAdd: (connection: Connection) => void;
  onClose: () => void;
}

export default function AddConnectionModal({
  characters,
  connectionTypes,
  onAdd,
  onClose,
}: Props) {
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [sourceInput, setSourceInput] = useState("");
  const [targetInput, setTargetInput] = useState("");
  const [label, setLabel] = useState("");
  const [type, setType] = useState(connectionTypes[0]?.id ?? "friendship");
  const [mutual, setMutual] = useState(true);

  const sortedCharacters = useMemo(
    () => [...characters].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())),
    [characters]
  );

  const sortedTargetCharacters = useMemo(
    () =>
      [...characters]
        .filter((c) => c.id !== source)
        .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())),
    [characters, source]
  );

  useEffect(() => {
    setSourceInput(characters.find((c) => c.id === source)?.name ?? "");
  }, [source, characters]);

  useEffect(() => {
    setTargetInput(characters.find((c) => c.id === target)?.name ?? "");
  }, [target, characters]);

  useEffect(() => {
    if (source && target && source === target) {
      setTarget("");
      setTargetInput("");
    }
  }, [source, target]);

  const normalize = (s: string) => {
    const t = s.trim().slice(0, 15);
    return t.charAt(0).toUpperCase() + t.slice(1);
  };

  const submit = () => {
    if (!source || !target || source === target || !label.trim()) return;
    onAdd({ id: uuidv4(), source, target, label: normalize(label), type, mutual: (mutual ? undefined : false) });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--overlay)" }}
    >
      <div
        className="w-full rounded-xl overflow-hidden fade-in"
        style={{
          maxWidth: "32rem",
          background: "var(--panel-gradient)",
          border: "1px solid var(--border-medium)",
          boxShadow: "0 40px 80px var(--shadow-xl)",
        }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <h3 className="font-display text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            New Connection
          </h3>
          <button
            onClick={onClose}
            style={{ color: "var(--text-muted)" }}
            className="appearance-none rounded border-0 outline-none bg-transparent hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="cl-label">From</label>
              <input
                className="cl-input"
                list="characters-from-list"
                value={sourceInput}
                onChange={(e) => {
                  const v = e.target.value;
                  setSourceInput(v);

                  const selected = sortedCharacters.find(
                    (c) => c.name.toLowerCase() === v.toLowerCase()
                  );
                  setSource(selected?.id ?? "");
                }}
                placeholder="Select or type a character…"
              />
              <datalist id="characters-from-list">
                {sortedCharacters.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>

            <div className="flex flex-col items-center gap-1 pb-0.5">
              <span className="cl-label">Mutual</span>
              <button
                onClick={() => setMutual(!mutual)}
                className="w-10 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                style={{
                  background: mutual ? "var(--gold-dim)" : "var(--bg-surface)",
                  border: `1px solid ${mutual ? "var(--gold-border)" : "var(--border-medium)"}`,
                  color: mutual ? "var(--gold)" : "var(--text-muted)",
                }}
              >
                {mutual ? <ArrowLeftRight size={16} /> : <ArrowRight size={16} />}
              </button>
            </div>

            <div className="flex-1">
              <label className="cl-label">To</label>
              <input
                className="cl-input"
                list="characters-to-list"
                value={targetInput}
                onChange={(e) => {
                  const v = e.target.value;
                  setTargetInput(v);

                  const selected = sortedTargetCharacters.find(
                    (c) => c.name.toLowerCase() === v.toLowerCase()
                  );
                  setTarget(selected?.id ?? "");
                }}
                placeholder="Select or type a character…"
              />
              <datalist id="characters-to-list">
                {sortedTargetCharacters.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="cl-label">
              Label <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({label.length}/15)</span>
            </label>
            <input
              className="cl-input"
              placeholder="Married, Rivals…"
              maxLength={15}
              value={label}
              onChange={(e) => {
                const v = e.target.value.slice(0, 15);
                setLabel(v.charAt(0).toUpperCase() + v.slice(1));
              }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>

          <div>
            <label className="cl-label mb-2">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {connectionTypes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className="py-2 px-3 rounded-lg text-sm font-mono text-left flex items-center gap-2 transition-all"
                  style={{
                    background: type === t.id ? `${t.color}25` : "var(--bg-surface)",
                    border: type === t.id ? `4px solid ${t.color}80` : "1px solid var(--border-subtle)",
                    color: type === t.id ? t.color : "var(--text-muted)",
                  }}
                >
                  <span style={{ fontSize: 18 }}>{t.emoji}</span> {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          className="px-6 py-4 flex justify-end gap-3"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-mono transition-all hover:scale-105"
            style={{
              color: "var(--text-muted)",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-medium)",
            }}
          >
            Cancel
          </button>

          <button
            onClick={submit}
            disabled={!source || !target || source === target || !label.trim()}
            className="px-5 py-2 rounded-lg text-sm font-mono flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, var(--text-muted), var(--gold))",
              color: "var(--bg-deep)",
              border: "1px solid var(--gold-border)",
              fontWeight: 600,
            }}
          >
            <Link size={14} /> Connect
          </button>
        </div>
      </div>
    </div>
  );
}
