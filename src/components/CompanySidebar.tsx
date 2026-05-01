import { useDroppable } from "@dnd-kit/core";
import {
  Archive,
  ArchiveRestore,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getCompanyStats, useStore } from "../store/useStore";
import {
  STATUS_COLOR,
  STATUS_LABEL,
  type Company,
  type Person,
} from "../types";
import { Avatar } from "./Avatar";
import { PopoverItem, PopoverMenu } from "./PopoverMenu";

type Props = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onAddCompany: () => void;
  onEditCompany: (c: Company) => void;
  onOpenPerson: (p: Person) => void;
};

export function CompanySidebar({
  collapsed,
  onToggleCollapse,
  onAddCompany,
  onEditCompany,
  onOpenPerson,
}: Props) {
  const companies = useStore((s) => s.companies);
  const persons = useStore((s) => s.persons);
  const [showArchived, setShowArchived] = useState(false);

  const visible = companies.filter((c) => showArchived || !c.archived);
  const activeCount = companies.filter((c) => !c.archived).length;
  const archivedCount = companies.length - activeCount;

  if (collapsed) {
    return (
      <aside className="shrink-0 w-12 border-l border-ink-100 bg-white flex flex-col items-center py-3 gap-2">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="btn-ghost !p-2"
          title="Unternehmen einblenden"
        >
          <ChevronRight size={16} />
        </button>
        <div className="h-px w-6 bg-ink-100 my-1" />
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors"
          title={`${activeCount} Unternehmen`}
        >
          <Building2 size={16} />
        </button>
        {activeCount > 0 && (
          <span className="text-[10px] font-semibold text-ink-700">
            {activeCount}
          </span>
        )}
      </aside>
    );
  }

  return (
    <aside className="shrink-0 w-[380px] border-l border-ink-100 bg-ink-50/40 flex flex-col min-h-0">
      <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-ink-100 bg-white">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Building2 size={15} />
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-ink-900 leading-tight">
            Unternehmen
          </h2>
          <p className="text-[11px] text-ink-500 leading-tight">
            {activeCount} aktiv
            {archivedCount > 0 ? ` · ${archivedCount} archiviert` : ""}
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary !px-2.5 !py-1.5 text-xs"
          onClick={onAddCompany}
        >
          <Plus size={13} /> Neu
        </button>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="btn-ghost !p-1.5"
          title="Sidebar einklappen"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {archivedCount > 0 && (
        <div className="shrink-0 px-4 py-2 border-b border-ink-100 bg-white">
          <label className="flex items-center gap-2 text-xs text-ink-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="accent-brand-600"
            />
            Archiv ({archivedCount}) anzeigen
          </label>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {visible.length === 0 ? (
          <EmptyState onAdd={onAddCompany} />
        ) : (
          visible.map((c) => (
            <CompanyDropCard
              key={c.id}
              company={c}
              persons={persons.filter((p) => p.companyId === c.id)}
              onEdit={() => onEditCompany(c)}
              onOpenPerson={onOpenPerson}
            />
          ))
        )}
      </div>
    </aside>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center text-ink-400 gap-3 px-4">
      <div className="h-12 w-12 rounded-full bg-ink-100 flex items-center justify-center">
        <Building2 size={20} />
      </div>
      <div>
        <p className="text-sm text-ink-700 font-medium">
          Noch keine Unternehmen
        </p>
        <p className="text-xs mt-1">
          Lege ein Unternehmen an, um Bewerber zuzuordnen.
        </p>
      </div>
      <button type="button" className="btn-primary mt-1" onClick={onAdd}>
        <Plus size={14} /> Erstes Unternehmen
      </button>
    </div>
  );
}

function CompanyDropCard({
  company,
  persons,
  onEdit,
  onOpenPerson,
}: {
  company: Company;
  persons: Person[];
  onEdit: () => void;
  onOpenPerson: (p: Person) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `company:${company.id}`,
    data: { type: "company", companyId: company.id },
  });

  const stats = getCompanyStats(company, persons);
  const removeCompany = useStore((s) => s.removeCompany);
  const toggleArchive = useStore((s) => s.toggleCompanyArchive);
  const setStatus = useStore((s) => s.setPersonStatus);
  const movePerson = useStore((s) => s.movePerson);

  const [expanded, setExpanded] = useState(persons.length > 0);
  useEffect(() => {
    if (persons.length === 0) setExpanded(false);
  }, [persons.length]);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  function handleDelete() {
    if (
      !confirm(
        `Unternehmen "${company.name}" löschen? Zugeordnete Personen wandern zurück in den Pool.`,
      )
    )
      return;
    removeCompany(company.id);
  }

  return (
    <div
      ref={setNodeRef}
      className={[
        "rounded-xl border bg-white transition-all",
        isOver
          ? "border-brand-400 ring-2 ring-brand-200 shadow-cardHover"
          : "border-ink-100 shadow-card",
        company.archived ? "opacity-60" : "",
      ].join(" ")}
    >
      <div
        className="flex items-center gap-2 px-3 py-2.5 border-l-4 rounded-l-xl"
        style={{ borderLeftColor: company.color }}
      >
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 flex items-center gap-2 text-left min-w-0"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-ink-900 truncate">
                {company.name}
              </h3>
              {stats.full && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-1.5 py-0.5 text-[10px] font-medium">
                  <Check size={9} /> Voll
                </span>
              )}
              {company.archived && (
                <span className="inline-flex items-center rounded-full bg-ink-100 text-ink-600 px-1.5 py-0.5 text-[10px] font-medium">
                  Archiv
                </span>
              )}
            </div>
            <p className="text-[11px] text-ink-500 mt-0.5">
              {stats.placed} / {stats.target} vermittelt
              {stats.proposed > 0 && ` · ${stats.proposed} vorgeschlagen`}
            </p>
          </div>

          <SlotsRow
            target={stats.target}
            placed={persons
              .filter((p) => p.status === "placed")
              .slice(0, stats.target)}
          />

          <ChevronDown
            size={14}
            className={`text-ink-400 transition-transform shrink-0 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>

        <button
          ref={menuButtonRef}
          type="button"
          className="btn-ghost !p-1.5"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Optionen"
        >
          <MoreHorizontal size={15} />
        </button>

        <PopoverMenu
          open={menuOpen}
          anchor={menuButtonRef.current}
          onClose={() => setMenuOpen(false)}
          width={200}
        >
          <PopoverItem
            icon={<Pencil size={14} />}
            onClick={() => {
              setMenuOpen(false);
              onEdit();
            }}
          >
            Bearbeiten
          </PopoverItem>
          <PopoverItem
            icon={
              company.archived ? (
                <ArchiveRestore size={14} />
              ) : (
                <Archive size={14} />
              )
            }
            onClick={() => {
              setMenuOpen(false);
              toggleArchive(company.id);
            }}
          >
            {company.archived ? "Wiederherstellen" : "Archivieren"}
          </PopoverItem>
          <PopoverItem
            icon={<Trash2 size={14} />}
            variant="danger"
            onClick={() => {
              setMenuOpen(false);
              handleDelete();
            }}
          >
            Löschen
          </PopoverItem>
        </PopoverMenu>
      </div>

      {expanded && (
        <div className="border-t border-ink-100 bg-ink-50/40 px-2.5 py-2 space-y-1.5 rounded-b-xl">
          {persons.length === 0 ? (
            <div
              className={[
                "min-h-[56px] flex items-center justify-center rounded-lg border-2 border-dashed text-xs",
                isOver
                  ? "border-brand-300 text-brand-600 bg-white"
                  : "border-ink-200 text-ink-400",
              ].join(" ")}
            >
              Person hierher ziehen
            </div>
          ) : (
            persons.map((p) => (
              <AssignedPersonRow
                key={p.id}
                person={p}
                onOpen={() => onOpenPerson(p)}
                onPromote={() => setStatus(p.id, "placed")}
                onDemote={() => setStatus(p.id, "proposed")}
                onRemove={() => movePerson(p.id, null)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SlotsRow({ target, placed }: { target: number; placed: Person[] }) {
  const slots = Array.from({ length: target }, (_, i) => placed[i] ?? null);
  return (
    <div className="flex -space-x-1.5 shrink-0">
      {slots.map((p, i) =>
        p ? (
          <div
            key={p.id}
            className="ring-2 ring-white rounded-full"
            title={`${p.firstName} ${p.lastName}`}
          >
            <Avatar
              fileId={p.photo?.id}
              name={`${p.firstName} ${p.lastName}`}
              size={22}
            />
          </div>
        ) : (
          <div
            key={`empty-${i}`}
            className="h-[22px] w-[22px] rounded-full border-2 border-dashed border-ink-200 bg-white ring-2 ring-white"
          />
        ),
      )}
    </div>
  );
}

function AssignedPersonRow({
  person,
  onOpen,
  onPromote,
  onDemote,
  onRemove,
}: {
  person: Person;
  onOpen: () => void;
  onPromote: () => void;
  onDemote: () => void;
  onRemove: () => void;
}) {
  const fullName = `${person.firstName} ${person.lastName}`.trim();
  const isPlaced = person.status === "placed";
  return (
    <div className="group flex items-center gap-2 rounded-lg bg-white border border-ink-100 px-2 py-1.5 hover:border-ink-200 transition-colors">
      <button
        type="button"
        onClick={onOpen}
        className="flex items-center gap-2 flex-1 min-w-0 text-left"
      >
        <Avatar fileId={person.photo?.id} name={fullName} size={28} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-ink-900 truncate leading-tight">
            {fullName || "Unbenannt"}
          </p>
          <p className="text-[11px] text-ink-500 truncate flex items-center gap-1 leading-tight mt-0.5">
            <span
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: STATUS_COLOR[person.status] }}
            />
            {STATUS_LABEL[person.status]}
          </p>
        </div>
      </button>

      <button
        type="button"
        onClick={isPlaced ? onDemote : onPromote}
        className={[
          "px-1.5 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0",
          isPlaced
            ? "text-amber-700 hover:bg-amber-50"
            : "text-emerald-700 hover:bg-emerald-50",
        ].join(" ")}
        title={isPlaced ? "Zurück zu Vorgeschlagen" : "Als Vermittelt markieren"}
      >
        {isPlaced ? "↩" : "✓"}
      </button>

      <button
        type="button"
        onClick={onRemove}
        className="btn-ghost !p-1 opacity-0 group-hover:opacity-100 shrink-0"
        aria-label="Zurück in Pool"
        title="Zurück in den Pool"
      >
        <X size={12} />
      </button>
    </div>
  );
}
