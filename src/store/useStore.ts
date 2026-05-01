import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { Company, Person, PersonStatus } from "../types";
import { deleteFile } from "../db/database";

const COMPANY_COLORS = [
  "#3a66ff",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#0ea5e9",
];

type State = {
  persons: Person[];
  companies: Company[];
};

type AddPersonInput = Omit<
  Person,
  "id" | "createdAt" | "companyId" | "status"
>;

type Actions = {
  addPerson: (data: AddPersonInput) => Person;
  updatePerson: (id: string, patch: Partial<Person>) => void;
  removePerson: (id: string) => Promise<void>;
  /** Assigns a person to a company (or null = back to pool). */
  movePerson: (
    personId: string,
    companyId: string | null,
    nextStatus?: PersonStatus,
  ) => void;
  setPersonStatus: (personId: string, status: PersonStatus) => void;

  addCompany: (data: {
    name: string;
    description?: string;
    targetSlots?: number;
  }) => Company;
  updateCompany: (id: string, patch: Partial<Company>) => void;
  removeCompany: (id: string) => void;
  toggleCompanyArchive: (id: string) => void;
};

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      persons: [],
      companies: [],

      addPerson: (data) => {
        const person: Person = {
          ...data,
          id: nanoid(),
          companyId: null,
          status: "available",
          createdAt: Date.now(),
        };
        set((s) => ({ persons: [person, ...s.persons] }));
        return person;
      },

      updatePerson: (id, patch) =>
        set((s) => ({
          persons: s.persons.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      removePerson: async (id) => {
        const person = get().persons.find((p) => p.id === id);
        if (person) {
          const fileIds = [
            person.photo?.id,
            person.cv?.id,
            person.coverLetter?.id,
          ].filter(Boolean) as string[];
          await Promise.all(
            fileIds.map((fid) => deleteFile(fid).catch(() => {})),
          );
        }
        set((s) => ({ persons: s.persons.filter((p) => p.id !== id) }));
      },

      movePerson: (personId, companyId, nextStatus) =>
        set((s) => ({
          persons: s.persons.map((p) => {
            if (p.id !== personId) return p;
            if (companyId === null) {
              return { ...p, companyId: null, status: "available" };
            }
            const status: PersonStatus =
              nextStatus ??
              (p.companyId === companyId && p.status === "placed"
                ? "placed"
                : "proposed");
            return { ...p, companyId, status };
          }),
        })),

      setPersonStatus: (personId, status) =>
        set((s) => ({
          persons: s.persons.map((p) => {
            if (p.id !== personId) return p;
            if (status === "available") {
              return { ...p, status, companyId: null };
            }
            return { ...p, status };
          }),
        })),

      addCompany: ({ name, description, targetSlots }) => {
        const existing = get().companies.length;
        const company: Company = {
          id: nanoid(),
          name: name.trim(),
          description: description?.trim() || undefined,
          color: COMPANY_COLORS[existing % COMPANY_COLORS.length],
          targetSlots: Math.max(1, targetSlots ?? 3),
          archived: false,
          createdAt: Date.now(),
        };
        set((s) => ({ companies: [...s.companies, company] }));
        return company;
      },

      updateCompany: (id, patch) =>
        set((s) => ({
          companies: s.companies.map((c) =>
            c.id === id ? { ...c, ...patch } : c,
          ),
        })),

      removeCompany: (id) =>
        set((s) => ({
          companies: s.companies.filter((c) => c.id !== id),
          persons: s.persons.map((p) =>
            p.companyId === id
              ? { ...p, companyId: null, status: "available" }
              : p,
          ),
        })),

      toggleCompanyArchive: (id) =>
        set((s) => ({
          companies: s.companies.map((c) =>
            c.id === id ? { ...c, archived: !c.archived } : c,
          ),
        })),
    }),
    {
      name: "dashboard-gevin-store",
      version: 2,
      migrate: (persisted: unknown, fromVersion: number) => {
        const state = (persisted ?? {}) as Partial<State>;
        if (fromVersion < 2) {
          state.persons = (state.persons ?? []).map((p) => ({
            ...p,
            status:
              (p as Partial<Person>).status ??
              (p.companyId ? "placed" : "available"),
          }));
          state.companies = (state.companies ?? []).map((c) => ({
            ...c,
            targetSlots: (c as Partial<Company>).targetSlots ?? 3,
            archived: (c as Partial<Company>).archived ?? false,
          }));
        }
        return state as State;
      },
    },
  ),
);

/** Returns counts for a company: { placed, proposed, target, full } */
export function getCompanyStats(
  company: Company,
  persons: Person[],
): { placed: number; proposed: number; target: number; full: boolean } {
  const inCompany = persons.filter((p) => p.companyId === company.id);
  const placed = inCompany.filter((p) => p.status === "placed").length;
  const proposed = inCompany.filter((p) => p.status === "proposed").length;
  return {
    placed,
    proposed,
    target: company.targetSlots,
    full: placed >= company.targetSlots,
  };
}
