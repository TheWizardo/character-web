import { useState } from "react";
import { Character, Form, FormErrors } from "../../lib/types";
import { X, Plus } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { CHAR_PALLETTE, CRIT_COLOR, RADIUS } from "../../lib/constants";
import { capitalize } from "../../lib/helpers";

interface Props {
  onAdd: (character: Character) => void;
  onClose: () => void;
}

export default function AddCharacterModal({ onAdd, onClose }: Props) {
  const [form, setForm] = useState<Form<Character>>({
    name: "",
    isDirty: false,
    color: CHAR_PALLETTE[Math.floor(Math.random() * CHAR_PALLETTE.length)],
    hobbies: [],
    size: RADIUS["medium"],
  });
  const [hobbiesText, setHobbiesText] = useState("");
  const [newColor, setNewColor] = useState(CHAR_PALLETTE[0]);


  const evaluateForm = (f: Form<Character>) => {
    const errors: FormErrors<Character> = {};

    if (!f.name?.trim()) {
      errors.name = "Character must have a name";
    }

    if (f.fullName !== undefined && !f.fullName.trim()) {
      delete f.fullName;
    }

    if (f.age !== undefined && (Number.isNaN(f.age) || f.age < 0)) {
      errors.age = "Age must be a non-negative number";
    }

    if (f.birthDate !== undefined && !f.birthDate.trim()) {
      delete f.birthDate;
    }

    if (f.physicalDescription !== undefined && !f.physicalDescription.trim()) {
      delete f.physicalDescription;
    }

    if (f.hobbies !== undefined && !Array.isArray(f.hobbies)) {
      errors.hobbies = "Hobbies must be a list";
    }

    if (f.address !== undefined && !f.address.trim()) {
      delete f.address;
    }

    if (f.workplace !== undefined && !f.workplace.trim()) {
      delete f.workplace;
    }

    if (f.education !== undefined && !f.education.trim()) {
      delete f.education;
    }

    if (f.additionalInfo !== undefined && !f.additionalInfo.trim()) {
      delete f.additionalInfo;
    }

    const newForm = { ...f, errors };

    if (Object.keys(errors).length === 0) {
      delete newForm.errors;
    }

    setForm(newForm);
    return newForm;
  };

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const newForm = evaluateForm(form);
    if (newForm.errors) {
      setForm({ ...newForm, isDirty: true });
      return;
    }

    const newCharacter = {
      id: uuidv4(),
      name: newForm.name.trim(),
      fullName: newForm.fullName || newForm.name.trim(),
      age: newForm.age,
      birthDate: newForm.birthDate,
      physicalDescription: newForm.physicalDescription || "",
      hobbies: hobbiesText.split(",").map((s) => s.trim()).filter(Boolean),
      address: newForm.address || "",
      workplace: newForm.workplace || "",
      education: newForm.education || "",
      additionalInfo: newForm.additionalInfo || "",
      color: newForm.color,
      size: newForm.size || RADIUS["medium"],
    }
    onAdd(newCharacter);
    onClose();
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
              <input className="cl-input" placeholder="Ellie" style={{ borderColor: form.isDirty && form.errors?.name ? CRIT_COLOR : "" }} title={form.isDirty ? form.errors?.name : ""}
                value={form.name || ""} onChange={(e) => evaluateForm({ ...form, name: capitalize(e.target.value) })}
                onKeyDown={(e) => e.key === "Enter" && submit()} />
            </div>
            <div>
              <label className="cl-label">Full Name</label>
              <input className="cl-input" placeholder="Eleanor Voss" style={{ borderColor: form.isDirty && form.errors?.fullName ? CRIT_COLOR : "" }} title={form.isDirty ? form.errors?.fullName : ""}
                value={form.fullName || ""} onChange={(e) => evaluateForm({ ...form, fullName: e.target.value.split(" ").map(n => capitalize(n)).join(" ") })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="cl-label">Age</label>
              <input type="number" className="cl-input" placeholder="34" style={{ borderColor: form.isDirty && form.errors?.age ? CRIT_COLOR : "" }} title={form.isDirty ? form.errors?.age : ""}
                value={form.age || form.age?.toString() || ""} onChange={(e) => evaluateForm({ ...form, age: parseInt(e.target.value) === 0 ? 0 : parseInt(e.target.value) || undefined })} />
            </div>
            <div>
              <label className="cl-label">Birthdate</label>
              <input type="date" className="cl-input" value={form.birthDate || ""} style={{ borderColor: form.isDirty && form.errors?.birthDate ? CRIT_COLOR : "" }} title={form.isDirty ? form.errors?.birthDate : ""}
                onChange={(e) => evaluateForm({ ...form, birthDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="cl-label">Physical Description</label>
            <textarea className="cl-input" rows={2} style={{ resize: "none", borderColor: form.isDirty && form.errors?.physicalDescription ? CRIT_COLOR : "" }} placeholder="Tall with auburn hair…"
              value={form.physicalDescription || ""} onChange={(e) => evaluateForm({ ...form, physicalDescription: e.target.value })} title={form.isDirty ? form.errors?.physicalDescription : ""} />
          </div>
          <div>
            <label className="cl-label">Hobbies (comma-separated)</label>
            <input className="cl-input" placeholder="Reading, Chess, Cooking" style={{ borderColor: form.isDirty && form.errors?.hobbies ? CRIT_COLOR : "" }} title={form.isDirty ? form.errors?.hobbies : ""}
              value={hobbiesText} onChange={(e) => setHobbiesText(e.target.value)} />
          </div>
          <div>
            <label className="cl-label">Address</label>
            <input className="cl-input" placeholder="14 Harlow Street" style={{ borderColor: form.isDirty && form.errors?.address ? CRIT_COLOR : "" }} title={form.isDirty ? form.errors?.address : ""}
              value={form.address || ""} onChange={(e) => evaluateForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="cl-label">Workplace</label>
            <input className="cl-input" placeholder="Voss & Merrick Antiquities" style={{ borderColor: form.isDirty && form.errors?.workplace ? CRIT_COLOR : "" }} title={form.isDirty ? form.errors?.workplace : ""}
              value={form.workplace || ""} onChange={(e) => evaluateForm({ ...form, workplace: e.target.value })} />
          </div>
          <div>
            <label className="cl-label">Education</label>
            <input className="cl-input" placeholder="MA in Art History, Edinburgh" style={{ borderColor: form.isDirty && form.errors?.education ? CRIT_COLOR : "" }} title={form.isDirty ? form.errors?.education : ""}
              value={form.education || ""} onChange={(e) => evaluateForm({ ...form, education: e.target.value })} />
          </div>
          <div>
            <label className="cl-label">Additional Information</label>
            <textarea className="cl-input" rows={3} style={{ resize: "vertical", borderColor: form.isDirty && form.errors?.additionalInfo ? CRIT_COLOR : "" }} placeholder="Backstory, secrets, arcs…" title={form.isDirty ? form.errors?.additionalInfo : ""}
              value={form.additionalInfo || ""} onChange={(e) => evaluateForm({ ...form, additionalInfo: e.target.value })} />
          </div>
          <div>
            <label className="cl-label">Color</label>
            <div className="flex gap-2 flex-wrap mt-1">
              {CHAR_PALLETTE.map((col) => (
                <button key={col} onClick={() => { evaluateForm({ ...form, color: col }); setNewColor(col); }}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{ background: col, border: form.color === col ? "2px solid var(--text-primary)" : "2px solid transparent", boxShadow: form.color === col ? `0 0 8px ${col}` : "none" }} />
              ))}
              <div className="flex gap-2 mt-1">
                <p className={`text-sm font-mono flex items-center justify-center`} style={{ textAlign: "center", color: "var(--gold)" }}>Custom</p>
                <input type="color" value={newColor} onChange={(e) => { evaluateForm({ ...form, color: e.target.value }); setNewColor(e.target.value) }}
                  className="w-7 h-7 rounded-full cursor-pointer border-0 p-0 bg-transparent" />
              </div>
            </div>
          </div>
          <div>
            <label className="cl-label">Size</label>
            <div
              className="flex mt-1 overflow-hidden"
              style={{
                width: 240,
                border: "1px solid var(--border-medium)",
                borderRadius: 10,
                background: "var(--bg-surface)",
              }}
            >
              {Object.keys(RADIUS).map((size, i) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setForm({ ...form, size: RADIUS[size] })}
                  className="py-1.5 text-sm font-mono transition-all"
                  style={{
                    flex: 1,
                    background: form.size === RADIUS[size] ? "var(--gold-dim)" : "transparent",
                    color: form.size === RADIUS[size] ? "var(--gold)" : "var(--text-muted)",
                    fontWeight: form.size === RADIUS[size] ? 600 : 400,
                    border: "none",
                    borderLeft: i === 0 ? "none" : "1px solid var(--border-medium)",
                    borderRadius: 0,
                  }}
                >
                  {capitalize(size)}
                </button>
              ))}
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
          <button onClick={submit} disabled={form.isDirty && form.errors !== undefined}
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
