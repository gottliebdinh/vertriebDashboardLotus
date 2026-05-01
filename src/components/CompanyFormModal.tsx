import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Modal } from "./Modal";
import { useStore } from "../store/useStore";
import type { Company } from "../types";

type Props = {
  open: boolean;
  onClose: () => void;
  editing?: Company | null;
};

export function CompanyFormModal({ open, onClose, editing }: Props) {
  const addCompany = useStore((s) => s.addCompany);
  const updateCompany = useStore((s) => s.updateCompany);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetSlots, setTargetSlots] = useState(3);

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setDescription(editing?.description ?? "");
    setTargetSlots(editing?.targetSlots ?? 3);
  }, [open, editing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      if (editing) {
        await updateCompany(editing.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          targetSlots: Math.max(1, targetSlots),
        });
      } else {
        await addCompany({ name, description, targetSlots });
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error ? err.message : "Speichern fehlgeschlagen.",
      );
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Unternehmen bearbeiten" : "Neues Unternehmen"}
      size="sm"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Abbrechen
          </button>
          <button type="submit" form="company-form" className="btn-primary">
            {editing ? "Speichern" : "Anlegen"}
          </button>
        </>
      }
    >
      <form id="company-form" onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label className="label">Name</label>
          <input
            className="input"
            placeholder="z.B. Bäckerei Müller"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label className="label">Bedarf (offene Plätze)</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-secondary !p-2"
              onClick={() => setTargetSlots((v) => Math.max(1, v - 1))}
              aria-label="Weniger"
            >
              <Minus size={14} />
            </button>
            <input
              type="number"
              min={1}
              max={50}
              className="input !w-20 text-center"
              value={targetSlots}
              onChange={(e) =>
                setTargetSlots(Math.max(1, Number(e.target.value) || 1))
              }
            />
            <button
              type="button"
              className="btn-secondary !p-2"
              onClick={() => setTargetSlots((v) => Math.min(50, v + 1))}
              aria-label="Mehr"
            >
              <Plus size={14} />
            </button>
            <span className="text-xs text-ink-500 ml-1">
              {targetSlots === 1 ? "Person" : "Personen"} gesucht
            </span>
          </div>
        </div>

        <div>
          <label className="label">Beschreibung</label>
          <textarea
            className="input min-h-[72px] resize-y"
            placeholder="Optional"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
