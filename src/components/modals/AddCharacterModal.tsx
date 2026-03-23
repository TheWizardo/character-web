import { useState } from "react";
import { Character } from "../../lib/types";
import { X, Plus } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { CHAR_PALLETTE } from "../../lib/constants";

interface Props {
  onAdd: (character: Character) => void;
  onClose: () => void;
}

export default function AddCharacterModal({ onAdd, onClose }: Props) {
  const [form, setForm] = useState<Partial<Character>>({
    color: CHAR_PALLETTE[Math.floor(Math.random() * CHAR_PALLETTE.length)],
    hobbies: [],
  });
  const [hobbiesText, setHobbiesText] = useState("");
  const [newColor, setNewColor] = useState(CHAR_PALLETTE[0]);

  const submit = () => {
    if (!form.name?.trim()) return;
    onAdd({
      id: uuidv4(),
      name: form.name.trim(),
      fullName: form.fullName || form.name.trim(),
      age: form.age,
      birthDate: form.birthDate,
      physicalDescription: form.physicalDescription || "",
      hobbies: hobbiesText.split(",").map((s) => s.trim()).filter(Boolean),
      address: form.address || "",
      workplace: form.workplace || "",
      education: form.education || "",
      additionalInfo: form.additionalInfo || "",
      color: form.color,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "var(--overlay)" }}>
      <div className="w-full max-w-md rounded-xl overflow-hidden fade-in flex flex-col"
        style={{ background: "var(--panel-gradient)", border: "1px solid var(--border-medium)", boxShadow: "0 40px 80px var(--shadow-xl)", maxHeight: "88vh" }}>

        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <h3 className="font-display text-lg font-semibold" style={{ color: "var(--text-primary)" }}>New Character</h3>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }} className="appearance-none rounded border-0 outline-none bg-transparent hover:bg-white/10 transition-colors"><X size={18} /></button>
        </div>

        <div className="px-6 py-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="cl-label">Name *</label>
              <input className="cl-input" placeholder="Eleanor"
                value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && submit()} />
            </div>
            <div>
              <label className="cl-label">Full Name</label>
              <input className="cl-input" placeholder="Eleanor Voss"
                value={form.fullName || ""} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="cl-label">Age</label>
              <input type="number" className="cl-input" placeholder="34"
                value={form.age || ""} onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) || undefined })} />
            </div>
            <div>
              <label className="cl-label">Birthdate</label>
              <input type="date" className="cl-input" value={form.birthDate || ""}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="cl-label">Physical Description</label>
            <textarea className="cl-input" rows={2} style={{ resize: "none" }} placeholder="Tall with auburn hair…"
              value={form.physicalDescription || ""} onChange={(e) => setForm({ ...form, physicalDescription: e.target.value })} />
          </div>
          <div>
            <label className="cl-label">Hobbies (comma-separated)</label>
            <input className="cl-input" placeholder="Reading, Chess, Cooking"
              value={hobbiesText} onChange={(e) => setHobbiesText(e.target.value)} />
          </div>
          <div>
            <label className="cl-label">Address</label>
            <input className="cl-input" placeholder="14 Harlow Street"
              value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="cl-label">Workplace</label>
            <input className="cl-input" placeholder="Voss & Merrick Antiquities"
              value={form.workplace || ""} onChange={(e) => setForm({ ...form, workplace: e.target.value })} />
          </div>
          <div>
            <label className="cl-label">Education</label>
            <input className="cl-input" placeholder="MA in Art History, Edinburgh"
              value={form.education || ""} onChange={(e) => setForm({ ...form, education: e.target.value })} />
          </div>
          <div>
            <label className="cl-label">Additional Information</label>
            <textarea className="cl-input" rows={3} style={{ resize: "vertical" }} placeholder="Backstory, secrets, arcs…"
              value={form.additionalInfo || ""} onChange={(e) => setForm({ ...form, additionalInfo: e.target.value })} />
          </div>
          <div>
            <label className="cl-label">Color</label>
            <div className="flex gap-2 flex-wrap mt-1">
              {CHAR_PALLETTE.map((col) => (
                <button key={col} onClick={() => { setForm({ ...form, color: col }); setNewColor(col); }}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{ background: col, border: form.color === col ? "2px solid var(--text-primary)" : "2px solid transparent", boxShadow: form.color === col ? `0 0 8px ${col}` : "none" }} />
              ))}
              <div className="flex gap-2 mt-1">
                <p className={`text-sm font-mono flex items-center justify-center`} style={{ textAlign: "center", color: "var(--gold)" }}>Custom</p>
                <input type="color" value={newColor} onChange={(e) => { setForm({ ...form, color: e.target.value }); setNewColor(e.target.value) }}
                  className="w-7 h-7 rounded-full cursor-pointer border-0 p-0 bg-transparent" />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 flex justify-end gap-3 flex-shrink-0"
          style={{ borderTop: "1px solid var(--border-subtle)" }}>
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
          <button onClick={submit} disabled={!form.name?.trim()}
            className="px-5 py-2 rounded-lg text-sm font-mono flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, var(--text-muted), var(--gold))",
              color: "var(--bg-deep)",
              border: "1px solid var(--gold-border)",
              fontWeight: 600,
            }}>
            <Plus size={14} /> Add Character
          </button>
        </div>
      </div>
    </div>
  );
}
