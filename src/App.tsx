import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  LayoutDashboard,
  Plus,
  Search,
  UserPlus,
} from "lucide-react";
import { useStore } from "./store/useStore";
import {
  STATUS_COLOR,
  STATUS_LABEL,
  type Company,
  type Person,
  type PersonStatus,
} from "./types";
import { PersonCard } from "./components/PersonCard";
import { PersonFormModal } from "./components/PersonFormModal";
import { CompanyFormModal } from "./components/CompanyFormModal";
import { PersonDetailModal } from "./components/PersonDetailModal";
import { PersonDragOverlay } from "./components/PersonDragOverlay";
import { CompanySidebar } from "./components/CompanySidebar";

const STATUS_FILTERS: { id: PersonStatus; defaultOn: boolean }[] = [
  { id: "available", defaultOn: true },
  { id: "proposed", defaultOn: true },
  { id: "placed", defaultOn: false },
];

export default function App() {
  const persons = useStore((s) => s.persons);
  const companies = useStore((s) => s.companies);
  const movePerson = useStore((s) => s.movePerson);

  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [statusFilter, setStatusFilter] = useState<Record<PersonStatus, boolean>>(
    () =>
      Object.fromEntries(
        STATUS_FILTERS.map((f) => [f.id, f.defaultOn]),
      ) as Record<PersonStatus, boolean>,
  );

  const [personFormOpen, setPersonFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  const [companyFormOpen, setCompanyFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const [detailPerson, setDetailPerson] = useState<Person | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const filteredPersons = useMemo(() => {
    const q = search.trim().toLowerCase();
    return persons.filter((p) => {
      if (!statusFilter[p.status]) return false;
      if (!q) return true;
      const hay = `${p.firstName} ${p.lastName} ${p.jobWish}`.toLowerCase();
      return hay.includes(q);
    });
  }, [persons, search, statusFilter]);

  const activePerson = useMemo(
    () => persons.find((p) => p.id === activeId) ?? null,
    [activeId, persons],
  );

  const counts = useMemo(() => {
    const c: Record<PersonStatus, number> = {
      available: 0,
      proposed: 0,
      placed: 0,
    };
    persons.forEach((p) => {
      c[p.status]++;
    });
    return c;
  }, [persons]);

  const activeCompanyCount = companies.filter((c) => !c.archived).length;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
    if (sidebarCollapsed) setSidebarCollapsed(false);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const overData = e.over?.data.current as
      | { type: string; companyId?: string }
      | undefined;
    if (!overData) return;

    const personId = String(e.active.id);
    if (overData.type === "company" && overData.companyId) {
      movePerson(personId, overData.companyId);
    } else if (overData.type === "pool") {
      movePerson(personId, null);
    }
  }

  function openCreatePerson() {
    setEditingPerson(null);
    setPersonFormOpen(true);
  }
  function openEditPerson(p: Person) {
    setDetailPerson(null);
    setEditingPerson(p);
    setPersonFormOpen(true);
  }
  function openCreateCompany() {
    setEditingCompany(null);
    setCompanyFormOpen(true);
  }
  function openEditCompany(c: Company) {
    setEditingCompany(c);
    setCompanyFormOpen(true);
  }

  return (
    <div className="h-full flex flex-col">
      <header className="shrink-0 border-b border-ink-100 bg-white/80 backdrop-blur z-30 relative">
        <div className="flex items-center gap-4 px-5 py-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-900 text-white">
              <LayoutDashboard size={18} />
            </span>
            <div>
              <h1 className="text-[15px] font-semibold text-ink-900 leading-tight">
                Dashboard GeVin
              </h1>
              <p className="text-xs text-ink-500 leading-tight">
                {persons.length} Bewerber · {activeCompanyCount} Unternehmen
              </p>
            </div>
          </div>

          <div className="relative flex-1 max-w-md ml-4">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name oder Arbeitswunsch suchen..."
              className="input pl-9"
            />
          </div>

          <div className="ml-auto flex items-center gap-2 shrink-0">
            <button type="button" onClick={openCreatePerson} className="btn-primary">
              <UserPlus size={15} /> Person
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-5 py-2 border-t border-ink-100 bg-white/50 overflow-x-auto">
          <span className="text-xs font-medium text-ink-500 mr-1 shrink-0">
            Status:
          </span>
          {STATUS_FILTERS.map(({ id }) => (
            <FilterChip
              key={id}
              active={statusFilter[id]}
              color={STATUS_COLOR[id]}
              count={counts[id]}
              onClick={() =>
                setStatusFilter((s) => ({ ...s, [id]: !s[id] }))
              }
            >
              {STATUS_LABEL[id]}
            </FilterChip>
          ))}
        </div>
      </header>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex-1 min-h-0 flex">
          <main className="flex-1 min-w-0 canvas-bg overflow-y-auto">
            {persons.length === 0 ? (
              <EmptyPool onAddPerson={openCreatePerson} />
            ) : filteredPersons.length === 0 ? (
              <EmptyFiltered />
            ) : (
              <div className="p-6">
                <div className="grid gap-5 grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
                  {filteredPersons.map((p) => (
                    <PersonCard
                      key={p.id}
                      person={p}
                      onOpen={setDetailPerson}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={openCreatePerson}
                    className="aspect-[4/5] flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-200 bg-white/40 text-ink-400 hover:border-brand-300 hover:text-brand-600 hover:bg-white transition-colors"
                  >
                    <Plus size={24} />
                    <span className="text-sm font-medium">
                      Person hinzufügen
                    </span>
                  </button>
                </div>
              </div>
            )}
          </main>

          <CompanySidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
            onAddCompany={openCreateCompany}
            onEditCompany={openEditCompany}
            onOpenPerson={setDetailPerson}
          />
        </div>

        <DragOverlay dropAnimation={null}>
          {activePerson ? <PersonDragOverlay person={activePerson} /> : null}
        </DragOverlay>
      </DndContext>

      <PersonFormModal
        open={personFormOpen}
        onClose={() => setPersonFormOpen(false)}
        editing={editingPerson}
      />
      <CompanyFormModal
        open={companyFormOpen}
        onClose={() => setCompanyFormOpen(false)}
        editing={editingCompany}
      />
      <PersonDetailModal
        open={!!detailPerson}
        onClose={() => setDetailPerson(null)}
        person={detailPerson}
        onEdit={openEditPerson}
      />
    </div>
  );
}

function FilterChip({
  active,
  color,
  count,
  onClick,
  children,
}: {
  active: boolean;
  color: string;
  count: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors shrink-0",
        active
          ? "bg-white border-ink-300 text-ink-900 shadow-sm"
          : "bg-transparent border-ink-200 text-ink-400 hover:text-ink-700",
      ].join(" ")}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: active ? color : "#d9d9e0" }}
      />
      {children}
      <span className="text-ink-400">{count}</span>
    </button>
  );
}

function EmptyPool({ onAddPerson }: { onAddPerson: () => void }) {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="text-center max-w-sm bg-white/80 rounded-2xl border border-ink-100 p-8 shadow-card">
        <div className="mx-auto h-14 w-14 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
          <UserPlus size={24} />
        </div>
        <h3 className="text-base font-semibold text-ink-900">
          Bewerber-Pool ist leer
        </h3>
        <p className="text-sm text-ink-500 mt-1">
          Lege deine erste Person mit Profilbild, Lebenslauf und Anschreiben an.
        </p>
        <button type="button" className="btn-primary mt-4" onClick={onAddPerson}>
          <UserPlus size={14} /> Erste Person anlegen
        </button>
      </div>
    </div>
  );
}

function EmptyFiltered() {
  return (
    <div className="h-full flex items-center justify-center p-6 text-center text-ink-400">
      <p className="text-sm">
        Keine Personen entsprechen den aktuellen Filtern.
      </p>
    </div>
  );
}
