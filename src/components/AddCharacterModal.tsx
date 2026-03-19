import { useState } from "react";
import { Character } from "../lib/types";
import { X, Plus } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface Props {
  onAdd: (character: Character) => void;
  onClose: () => void;
}

const COLORS = ["#c0392b","#2980b9","#16a085","#8e44ad","#e67e22","#27ae60","#d4a843","#8b6f47","#2c3e50","#e84393"];

export default function AddCharacterModal({ onAdd, onClose }: Props) {
  const [form, setForm] = useState<Partial<Character>>({
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    hobbies: [],
  });
  const [hobbiesText, setHobbiesText] = useState("");

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
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}><X size={18} /></button>
        </div>

        <div className="px-6 py-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="cw-label">Name *</label>
              <input className="cw-input" placeholder="Eleanor"
                value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && submit()} />
            </div>
            <div>
              <label className="cw-label">Full Name</label>
              <input className="cw-input" placeholder="Eleanor Voss"
                value={form.fullName || ""} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="cw-label">Age</label>
              <input type="number" className="cw-input" placeholder="34"
                value={form.age || ""} onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) || undefined })} />
            </div>
            <div>
              <label className="cw-label">Birthdate</label>
              <input type="date" className="cw-input" value={form.birthDate || ""}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="cw-label">Physical Description</label>
            <textarea className="cw-input" rows={2} style={{ resize: "none" }} placeholder="Tall with auburn hair…"
              value={form.physicalDescription || ""} onChange={(e) => setForm({ ...form, physicalDescription: e.target.value })} />
          </div>
          <div>
            <label className="cw-label">Hobbies (comma-separated)</label>
            <input className="cw-input" placeholder="Reading, Chess, Cooking"
              value={hobbiesText} onChange={(e) => setHobbiesText(e.target.value)} />
          </div>
          <div>
            <label className="cw-label">Address</label>
            <input className="cw-input" placeholder="14 Harlow Street"
              value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="cw-label">Workplace</label>
            <input className="cw-input" placeholder="Voss & Merrick Antiquities"
              value={form.workplace || ""} onChange={(e) => setForm({ ...form, workplace: e.target.value })} />
          </div>
          <div>
            <label className="cw-label">Education</label>
            <input className="cw-input" placeholder="MA in Art History, Edinburgh"
              value={form.education || ""} onChange={(e) => setForm({ ...form, education: e.target.value })} />
          </div>
          <div>
            <label className="cw-label">Additional Information</label>
            <textarea className="cw-input" rows={3} style={{ resize: "vertical" }} placeholder="Backstory, secrets, arcs…"
              value={form.additionalInfo || ""} onChange={(e) => setForm({ ...form, additionalInfo: e.target.value })} />
          </div>
          <div>
            <label className="cw-label">Color</label>
            <div className="flex gap-2 flex-wrap mt-1">
              {COLORS.map((col) => (
                <button key={col} onClick={() => setForm({ ...form, color: col })}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{ background: col, border: form.color === col ? "2px solid var(--text-primary)" : "2px solid transparent", boxShadow: form.color === col ? `0 0 8px ${col}` : "none" }} />
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 flex justify-end gap-3 flex-shrink-0"
          style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <button onClick={onClose} className="px-4 py-2 text-sm font-mono" style={{ color: "var(--text-muted)" }}>Cancel</button>
          <button onClick={submit} disabled={!form.name?.trim()}
            className="px-5 py-2 rounded-lg text-sm font-mono flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, var(--text-muted), var(--gold))", color: "var(--bg-deep)", fontWeight: 600 }}>
            <Plus size={14} /> Add Character
          </button>
        </div>
      </div>
    </div>
  );
}
