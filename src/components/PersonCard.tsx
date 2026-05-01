import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Briefcase, FileText } from "lucide-react";
import { useFileUrl } from "../hooks/useFileUrl";
import { ageFromBirthDate } from "../utils/age";
import {
  STATUS_COLOR,
  STATUS_LABEL,
  type Person,
} from "../types";
import { useStore } from "../store/useStore";

type Props = {
  person: Person;
  onOpen: (person: Person) => void;
};

export function PersonCard({ person, onOpen }: Props) {
  const { attributes, listeners, setNodeRef, isDragging, transform } =
    useDraggable({
      id: person.id,
      data: { type: "person", personId: person.id },
    });

  const photoUrl = useFileUrl(person.photo?.id);
  const companies = useStore((s) => s.companies);
  const company = companies.find((c) => c.id === person.companyId);

  const age = ageFromBirthDate(person.birthDate);
  const fullName = `${person.firstName} ${person.lastName}`.trim();
  const docsCount = (person.cv ? 1 : 0) + (person.coverLetter ? 1 : 0);
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "group relative bg-white rounded-2xl border border-ink-100 overflow-hidden",
        "shadow-card hover:shadow-cardHover transition-all duration-200",
        "hover:-translate-y-1 cursor-grab active:cursor-grabbing select-none",
        isDragging ? "opacity-30" : "",
      ].join(" ")}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(person)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(person);
        }
      }}
    >
      <div className="relative aspect-[4/5] w-full bg-gradient-to-br from-ink-100 to-ink-200 overflow-hidden">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={fullName}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-ink-400">
            <span className="text-5xl font-medium">{initials || "?"}</span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />

        <div className="absolute top-2.5 left-2.5">
          <StatusPill status={person.status} />
        </div>

        {company && (
          <div className="absolute top-2.5 right-2.5">
            <span
              className="inline-flex items-center gap-1 rounded-full bg-black/55 backdrop-blur px-2 py-0.5 text-[10px] font-medium text-white"
              title={company.name}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: company.color }}
              />
              <span className="max-w-[120px] truncate">{company.name}</span>
            </span>
          </div>
        )}

        {docsCount > 0 && (
          <div className="absolute bottom-2.5 right-2.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/85 backdrop-blur px-2 py-0.5 text-[10px] font-medium text-ink-700">
              <FileText size={10} />
              {docsCount}
            </span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-3 text-white">
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-base font-semibold leading-tight truncate">
              {fullName || "Unbenannt"}
            </h3>
            {age !== null && (
              <span className="text-xs opacity-80 shrink-0">· {age}</span>
            )}
          </div>
        </div>
      </div>

      <div className="px-3 py-2.5 min-h-[44px] flex items-center gap-1.5 text-sm text-ink-700">
        {person.jobWish ? (
          <>
            <Briefcase size={13} className="text-ink-400 shrink-0" />
            <span className="truncate">{person.jobWish}</span>
          </>
        ) : (
          <span className="text-ink-400 italic text-xs">
            Kein Arbeitswunsch
          </span>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: Person["status"] }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur px-2 py-0.5 text-[10px] font-medium text-ink-800 shadow-sm"
      title={STATUS_LABEL[status]}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: STATUS_COLOR[status] }}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}
