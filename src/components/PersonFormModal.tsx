import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { FileInput } from "./FileInput";
import { Avatar } from "./Avatar";
import { useStore } from "../store/useStore";
import { saveFile, deleteFile } from "../db/database";
import type { FileRef, Person, PersonUploadFiles } from "../types";

type Props = {
  open: boolean;
  onClose: () => void;
  /** When set, the form edits this person; otherwise creates a new one. */
  editing?: Person | null;
};

type Form = {
  firstName: string;
  lastName: string;
  birthDate: string;
  jobWish: string;
  notes: string;
  photo?: FileRef;
  cv?: FileRef;
  coverLetter?: FileRef;
};

const empty: Form = {
  firstName: "",
  lastName: "",
  birthDate: "",
  jobWish: "",
  notes: "",
};

export function PersonFormModal({ open, onClose, editing }: Props) {
  const addPerson = useStore((s) => s.addPerson);
  const updatePerson = useStore((s) => s.updatePerson);
  const [form, setForm] = useState<Form>(empty);
  const [saving, setSaving] = useState(false);
  /** Original browser-Files für zuverlässigen Supabase-Upload */
  const [uploadFiles, setUploadFiles] = useState<PersonUploadFiles>({});
  /** Files saved during this session that we may need to clean up on cancel. */
  const [pendingFileIds, setPendingFileIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setUploadFiles({});
    if (editing) {
      setForm({
        firstName: editing.firstName,
        lastName: editing.lastName,
        birthDate: editing.birthDate ?? "",
        jobWish: editing.jobWish,
        notes: editing.notes ?? "",
        photo: editing.photo,
        cv: editing.cv,
        coverLetter: editing.coverLetter,
      });
    } else {
      setForm(empty);
    }
    setPendingFileIds([]);
  }, [open, editing]);

  async function handleFile(field: "photo" | "cv" | "coverLetter", file: File) {
    const ref = await saveFile(file);
    setPendingFileIds((ids) => [...ids, ref.id]);
    setUploadFiles((u) => ({ ...u, [field]: file }));
    setForm((f) => {
      const prev = f[field];
      if (prev?.id && !prev.storagePath) deleteFile(prev.id).catch(() => {});
      return { ...f, [field]: ref };
    });
  }

  function handleRemove(field: "photo" | "cv" | "coverLetter") {
    setUploadFiles((u) => {
      const n = { ...u };
      delete n[field];
      return n;
    });
    setForm((f) => {
      const prev = f[field];
      if (prev?.id && !prev.storagePath) deleteFile(prev.id).catch(() => {});
      return { ...f, [field]: undefined };
    });
  }

  async function handleCancel() {
    if (!editing) {
      await Promise.all(pendingFileIds.map((id) => deleteFile(id).catch(() => {})));
    }
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName.trim() && !form.lastName.trim()) return;
    setSaving(true);
    try {
      const data = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        birthDate: form.birthDate || undefined,
        jobWish: form.jobWish.trim(),
        notes: form.notes.trim() || undefined,
        photo: form.photo,
        cv: form.cv,
        coverLetter: form.coverLetter,
      };
      if (editing) {
        await updatePerson(editing.id, data, uploadFiles);
      } else {
        await addPerson(data, uploadFiles);
      }
      onClose();
    } catch (e) {
      console.error(e);
      alert(
        e instanceof Error ? e.message : "Speichern fehlgeschlagen (Supabase).",
      );
    } finally {
      setSaving(false);
    }
  }

  const fullName = `${form.firstName} ${form.lastName}`.trim() || "Neue Person";

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      title={editing ? "Person bearbeiten" : "Neue Person"}
      size="lg"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={handleCancel}>
            Abbrechen
          </button>
          <button
            type="submit"
            form="person-form"
            className="btn-primary"
            disabled={saving}
          >
            {editing ? "Speichern" : "Person anlegen"}
          </button>
        </>
      }
    >
      <form
        id="person-form"
        onSubmit={handleSubmit}
        className="p-5 space-y-5"
      >
        <div className="flex items-center gap-4 p-4 rounded-xl bg-ink-50">
          <Avatar file={form.photo} name={fullName} size={64} />
          <div className="flex-1">
            <p className="text-sm font-medium text-ink-900">{fullName}</p>
            {form.jobWish && (
              <p className="text-xs text-ink-500 mt-0.5">{form.jobWish}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Vorname</label>
            <input
              className="input"
              value={form.firstName}
              onChange={(e) =>
                setForm((f) => ({ ...f, firstName: e.target.value }))
              }
              autoFocus
            />
          </div>
          <div>
            <label className="label">Nachname</label>
            <input
              className="input"
              value={form.lastName}
              onChange={(e) =>
                setForm((f) => ({ ...f, lastName: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="label">Geburtsdatum</label>
            <input
              type="date"
              className="input"
              value={form.birthDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, birthDate: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="label">Arbeitswunsch</label>
            <input
              className="input"
              placeholder="z.B. Bäckereifachverkäuferin"
              value={form.jobWish}
              onChange={(e) =>
                setForm((f) => ({ ...f, jobWish: e.target.value }))
              }
            />
          </div>
        </div>

        <div>
          <label className="label">Notizen</label>
          <textarea
            className="input min-h-[72px] resize-y"
            placeholder="Optional"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FileInput
            label="Profilbild"
            accept="image/*"
            icon="image"
            current={form.photo}
            onSelect={(f) => handleFile("photo", f)}
            onRemove={() => handleRemove("photo")}
          />
          <FileInput
            label="Lebenslauf (PDF)"
            accept="application/pdf"
            current={form.cv}
            onSelect={(f) => handleFile("cv", f)}
            onRemove={() => handleRemove("cv")}
          />
          <FileInput
            label="Anschreiben (PDF)"
            accept="application/pdf"
            current={form.coverLetter}
            onSelect={(f) => handleFile("coverLetter", f)}
            onRemove={() => handleRemove("coverLetter")}
          />
        </div>
      </form>
    </Modal>
  );
}
