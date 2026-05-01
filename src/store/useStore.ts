import { create, type StateCreator } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { Company, Person, PersonStatus, PersonUploadFiles } from "../types";
import { deleteFile } from "../db/database";
import { isSupabaseConfigured } from "../lib/supabaseConfigured";
import {
  deleteCompanyRemote,
  deletePersonRemote,
  fetchDashboardData,
  fetchPersonById,
  insertCompanyRemote,
  insertPersonRemote,
  updateCompanyRemote,
  updatePersonRemote,
} from "../lib/supabaseData";

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
  addPerson: (
    data: AddPersonInput,
    uploadFiles?: PersonUploadFiles,
  ) => Promise<Person>;
  updatePerson: (
    id: string,
    patch: Partial<Person>,
    uploadFiles?: PersonUploadFiles,
  ) => Promise<void>;
  removePerson: (id: string) => Promise<void>;
  movePerson: (
    personId: string,
    companyId: string | null,
    nextStatus?: PersonStatus,
  ) => Promise<void>;
  setPersonStatus: (personId: string, status: PersonStatus) => Promise<void>;

  addCompany: (data: {
    name: string;
    description?: string;
    targetSlots?: number;
  }) => Promise<Company>;
  updateCompany: (id: string, patch: Partial<Company>) => Promise<void>;
  removeCompany: (id: string) => Promise<void>;
  toggleCompanyArchive: (id: string) => Promise<void>;
};

const buildStore: StateCreator<State & Actions> = (set, get) => ({
  persons: [],
  companies: [],

  addPerson: async (data, uploadFiles) => {
    if (isSupabaseConfigured()) {
      const person = await insertPersonRemote(data, uploadFiles);
      set((s) => ({ persons: [person, ...s.persons] }));
      return person;
    }
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

  updatePerson: async (id, patch, uploadFiles) => {
    if (isSupabaseConfigured()) {
      await updatePersonRemote(id, patch, uploadFiles);
      const fresh = await fetchPersonById(id);
      if (fresh) {
        set((s) => ({
          persons: s.persons.map((p) => (p.id === id ? fresh : p)),
        }));
      }
      return;
    }
    set((s) => ({
      persons: s.persons.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  },

  removePerson: async (id) => {
    const person = get().persons.find((p) => p.id === id);
    if (isSupabaseConfigured() && person) {
      await deletePersonRemote(person);
      set((s) => ({ persons: s.persons.filter((p) => p.id !== id) }));
      return;
    }
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

  movePerson: async (personId, companyId, nextStatus) => {
    const p = get().persons.find((x) => x.id === personId);
    if (!p) return;

    let remotePatch: Partial<Person>;
    if (companyId === null) {
      remotePatch = { companyId: null, status: "available" };
    } else {
      const status: PersonStatus =
        nextStatus ??
        (p.companyId === companyId && p.status === "placed"
          ? "placed"
          : "proposed");
      remotePatch = { companyId, status };
    }

    if (isSupabaseConfigured()) {
      await updatePersonRemote(personId, remotePatch);
      const fresh = await fetchPersonById(personId);
      if (fresh) {
        set((s) => ({
          persons: s.persons.map((x) => (x.id === personId ? fresh : x)),
        }));
      }
      return;
    }

    set((s) => ({
      persons: s.persons.map((person) => {
        if (person.id !== personId) return person;
        if (companyId === null) {
          return { ...person, companyId: null, status: "available" };
        }
        const status: PersonStatus =
          nextStatus ??
          (person.companyId === companyId && person.status === "placed"
            ? "placed"
            : "proposed");
        return { ...person, companyId, status };
      }),
    }));
  },

  setPersonStatus: async (personId, status) => {
    if (isSupabaseConfigured()) {
      const patch: Partial<Person> = { status };
      if (status === "available") {
        patch.companyId = null;
      }
      await updatePersonRemote(personId, patch);
      const fresh = await fetchPersonById(personId);
      if (fresh) {
        set((s) => ({
          persons: s.persons.map((p) => (p.id === personId ? fresh : p)),
        }));
      }
      return;
    }
    set((s) => ({
      persons: s.persons.map((p) => {
        if (p.id !== personId) return p;
        if (status === "available") {
          return { ...p, status, companyId: null };
        }
        return { ...p, status };
      }),
    }));
  },

  addCompany: async ({ name, description, targetSlots }) => {
    const existing = get().companies.length;
    if (isSupabaseConfigured()) {
      const company = await insertCompanyRemote({
        name: name.trim(),
        color: COMPANY_COLORS[existing % COMPANY_COLORS.length],
        description: description?.trim(),
        targetSlots: Math.max(1, targetSlots ?? 3),
      });
      set((s) => ({ companies: [...s.companies, company] }));
      return company;
    }
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

  updateCompany: async (id, patch) => {
    if (isSupabaseConfigured()) {
      await updateCompanyRemote(id, {
        name: patch.name,
        color: patch.color,
        description: patch.description,
        targetSlots: patch.targetSlots,
        archived: patch.archived,
      });
      set((s) => ({
        companies: s.companies.map((c) =>
          c.id === id ? { ...c, ...patch } : c,
        ),
      }));
      return;
    }
    set((s) => ({
      companies: s.companies.map((c) =>
        c.id === id ? { ...c, ...patch } : c,
      ),
    }));
  },

  removeCompany: async (id) => {
    if (isSupabaseConfigured()) {
      await deleteCompanyRemote(id);
      const data = await fetchDashboardData();
      set({
        companies: data.companies,
        persons: data.persons,
      });
      return;
    }
    set((s) => ({
      companies: s.companies.filter((c) => c.id !== id),
      persons: s.persons.map((p) =>
        p.companyId === id
          ? { ...p, companyId: null, status: "available" }
          : p,
      ),
    }));
  },

  toggleCompanyArchive: async (id) => {
    const c = get().companies.find((x) => x.id === id);
    if (!c) return;
    const archived = !c.archived;
    if (isSupabaseConfigured()) {
      await updateCompanyRemote(id, { archived });
      set((s) => ({
        companies: s.companies.map((co) =>
          co.id === id ? { ...co, archived } : co,
        ),
      }));
      return;
    }
    set((s) => ({
      companies: s.companies.map((co) =>
        co.id === id ? { ...co, archived } : co,
      ),
    }));
  },
});

const persistOptions = {
  name: "lotus-eagle-dashboard-store",
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
};

const storeWithoutPersist = create<State & Actions>()(buildStore);
const storeWithPersist = create<State & Actions>()(
  persist(buildStore, persistOptions),
);

export const useStore = isSupabaseConfigured()
  ? storeWithoutPersist
  : storeWithPersist;

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
