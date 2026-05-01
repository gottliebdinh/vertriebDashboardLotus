import { Briefcase, Building2, Cake, Pencil, Trash2 } from "lucide-react";
import { Modal } from "./Modal";
import { Avatar } from "./Avatar";
import { PdfPane } from "./PdfPane";
import { useStore } from "../store/useStore";
import { ageFromBirthDate } from "../utils/age";
import {
  STATUS_COLOR,
  STATUS_LABEL,
  type Person,
  type PersonStatus,
} from "../types";

type Props = {
  open: boolean;
  onClose: () => void;
  person: Person | null;
  onEdit: (p: Person) => void;
};

const STATUS_OPTIONS: PersonStatus[] = ["available", "proposed", "placed"];

export function PersonDetailModal({ open, onClose, person, onEdit }: Props) {
  const removePerson = useStore((s) => s.removePerson);
  const movePerson = useStore((s) => s.movePerson);
  const setStatus = useStore((s) => s.setPersonStatus);
  const companies = useStore((s) => s.companies);
  const company = companies.find((c) => c.id === person?.companyId);

  if (!person) return null;

  const age = ageFromBirthDate(person.birthDate);
  const fullName = `${person.firstName} ${person.lastName}`.trim();

  async function handleDelete() {
    if (!person) return;
    if (
      !confirm(
        `"${fullName}" wirklich löschen? Alle hochgeladenen Dokumente werden entfernt.`,
      )
    )
      return;
    await removePerson(person.id);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={fullName || "Person"}
      footer={
        <>
          <button
            type="button"
            className="btn-danger mr-auto"
            onClick={handleDelete}
          >
            <Trash2 size={14} /> Löschen
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onEdit(person)}
          >
            <Pencil size={14} /> Bearbeiten
          </button>
          <button type="button" className="btn-primary" onClick={onClose}>
            Fertig
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 p-5 h-[78vh]">
        <aside className="space-y-4 overflow-y-auto pr-1">
          <div className="flex flex-col items-center text-center">
            <Avatar file={person.photo} name={fullName} size={140} />
            <h3 className="mt-3 text-lg font-semibold text-ink-900">
              {fullName}
            </h3>
          </div>

          <div className="space-y-3 text-sm">
            {person.jobWish && (
              <InfoRow icon={<Briefcase size={14} />} label="Arbeitswunsch">
                {person.jobWish}
              </InfoRow>
            )}
            {age !== null && (
              <InfoRow icon={<Cake size={14} />} label="Alter">
                {age} Jahre
              </InfoRow>
            )}

            <InfoRow icon={<Building2 size={14} />} label="Status">
              <div className="flex gap-1 flex-wrap">
                {STATUS_OPTIONS.map((s) => {
                  const active = person.status === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(person.id, s)}
                      className={[
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors",
                        active
                          ? "bg-ink-900 text-white border-ink-900"
                          : "bg-white text-ink-700 border-ink-200 hover:bg-ink-50",
                      ].join(" ")}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: STATUS_COLOR[s] }}
                      />
                      {STATUS_LABEL[s]}
                    </button>
                  );
                })}
              </div>
            </InfoRow>

            <InfoRow icon={<Building2 size={14} />} label="Unternehmen">
              <select
                className="input !py-1.5 !text-sm"
                value={person.companyId ?? ""}
                onChange={(e) => {
                  void movePerson(person.id, e.target.value || null);
                }}
              >
                <option value="">— Kein Unternehmen (Pool) —</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.archived ? " (Archiv)" : ""}
                  </option>
                ))}
              </select>
              {company && (
                <span
                  className="mt-1.5 inline-flex items-center gap-1 text-xs"
                  style={{ color: company.color }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: company.color }}
                  />
                  Aktuell bei {company.name}
                </span>
              )}
            </InfoRow>
          </div>

          {person.notes && (
            <div>
              <p className="label">Notizen</p>
              <p className="text-sm text-ink-700 whitespace-pre-wrap rounded-lg bg-ink-50 p-3">
                {person.notes}
              </p>
            </div>
          )}
        </aside>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
          <PdfPane title="Lebenslauf" file={person.cv} />
          <PdfPane title="Anschreiben" file={person.coverLetter} />
        </div>
      </div>
    </Modal>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-ink-900">{children}</div>
    </div>
  );
}
