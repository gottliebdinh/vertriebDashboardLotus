export type FileRef = {
  /** Key in the IndexedDB "files" store */
  id: string;
  name: string;
  type: string;
  size: number;
};

export type PersonStatus = "available" | "proposed" | "placed";

export type Person = {
  id: string;
  firstName: string;
  lastName: string;
  /** ISO date (yyyy-mm-dd) – age is derived */
  birthDate?: string;
  jobWish: string;
  notes?: string;
  /** ID of the assigned company, or null when in the unassigned pool */
  companyId: string | null;
  /** Workflow status. "available" implies companyId === null. */
  status: PersonStatus;
  photo?: FileRef;
  cv?: FileRef;
  coverLetter?: FileRef;
  createdAt: number;
};

export type Company = {
  id: string;
  name: string;
  color: string;
  description?: string;
  /** Number of placement slots this company wants to fill */
  targetSlots: number;
  /** When archived, hidden from main views but still searchable */
  archived: boolean;
  createdAt: number;
};

export const STATUS_LABEL: Record<PersonStatus, string> = {
  available: "Verfügbar",
  proposed: "Vorgeschlagen",
  placed: "Vermittelt",
};

export const STATUS_COLOR: Record<PersonStatus, string> = {
  available: "#10b981",
  proposed: "#f59e0b",
  placed: "#3a66ff",
};
