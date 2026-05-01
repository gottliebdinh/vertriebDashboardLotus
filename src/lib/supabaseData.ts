import { getFileBlob } from "../db/database";
import type {
  Company,
  FileRef,
  Person,
  PersonStatus,
  PersonUploadFiles,
} from "../types";
import { PERSON_FILES_BUCKET } from "./storageBucket";
import { supabase } from "./supabase";

type CompanyRow = {
  id: string;
  name: string;
  color: string;
  description: string | null;
  target_slots: number;
  archived: boolean;
  created_at: string;
};

type PersonRow = {
  id: string;
  company_id: string | null;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  job_wish: string;
  notes: string | null;
  status: PersonStatus;
  photo_path: string | null;
  photo_original_name: string | null;
  cv_path: string | null;
  cv_original_name: string | null;
  cover_letter_path: string | null;
  cover_letter_original_name: string | null;
  created_at: string;
};

function refFromPaths(
  path: string | null,
  originalName: string | null,
  mimeFallback: string,
): FileRef | undefined {
  if (!path) return undefined;
  return {
    id: path,
    name: originalName ?? path.split("/").pop() ?? "Datei",
    type: mimeFallback,
    size: 0,
    storagePath: path,
  };
}

export function mapPersonRow(row: PersonRow): Person {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    birthDate: row.birth_date ?? undefined,
    jobWish: row.job_wish,
    notes: row.notes ?? undefined,
    companyId: row.company_id,
    status: row.status,
    photo: refFromPaths(
      row.photo_path,
      row.photo_original_name,
      "image/jpeg",
    ),
    cv: refFromPaths(row.cv_path, row.cv_original_name, "application/pdf"),
    coverLetter: refFromPaths(
      row.cover_letter_path,
      row.cover_letter_original_name,
      "application/pdf",
    ),
    createdAt: new Date(row.created_at).getTime(),
  };
}

function mapCompanyRow(row: CompanyRow): Company {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    description: row.description ?? undefined,
    targetSlots: row.target_slots,
    archived: row.archived,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export async function fetchPersonById(id: string): Promise<Person | null> {
  const { data, error } = await supabase
    .from("persons")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return mapPersonRow(data as PersonRow);
}

export async function fetchDashboardData(): Promise<{
  companies: Company[];
  persons: Person[];
}> {
  const [companiesRes, personsRes] = await Promise.all([
    supabase.from("companies").select("*").order("created_at", { ascending: false }),
    supabase.from("persons").select("*").order("created_at", { ascending: false }),
  ]);
  if (companiesRes.error) throw companiesRes.error;
  if (personsRes.error) throw personsRes.error;
  return {
    companies: (companiesRes.data as CompanyRow[]).map(mapCompanyRow),
    persons: (personsRes.data as PersonRow[]).map(mapPersonRow),
  };
}

export async function insertCompanyRemote(input: {
  name: string;
  color: string;
  description?: string;
  targetSlots: number;
}): Promise<Company> {
  const { data, error } = await supabase
    .from("companies")
    .insert({
      name: input.name,
      color: input.color,
      description: input.description ?? null,
      target_slots: input.targetSlots,
      archived: false,
    })
    .select()
    .single();
  if (error) throw error;
  return mapCompanyRow(data as CompanyRow);
}

export async function updateCompanyRemote(
  id: string,
  patch: Partial<{
    name: string;
    color: string;
    description: string | undefined;
    targetSlots: number;
    archived: boolean;
  }>,
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.color !== undefined) row.color = patch.color;
  if (patch.description !== undefined) row.description = patch.description ?? null;
  if (patch.targetSlots !== undefined) row.target_slots = patch.targetSlots;
  if (patch.archived !== undefined) row.archived = patch.archived;
  const { error } = await supabase.from("companies").update(row).eq("id", id);
  if (error) throw error;
}

export async function deleteCompanyRemote(id: string): Promise<void> {
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) throw error;
}

function uploadErrorHint(message: string): string {
  let m = message;
  if (/bucket|not found|Bucket/i.test(m)) {
    m +=
      " — Im Dashboard unter Storage den Bucket „person-files“ anlegen und die Datei supabase/storage_person_files.sql ausführen.";
  }
  if (/row-level security|RLS|permission denied/i.test(m)) {
    m +=
      " — Storage-Policies prüfen (storage_person_files.sql im SQL Editor ausführen).";
  }
  return m;
}

async function uploadAttachment(
  personId: string,
  kind: "photo" | "cv" | "coverLetter",
  fileRef: FileRef,
  rawFile?: File,
): Promise<{ path: string; originalName: string }> {
  const blob: Blob | undefined =
    rawFile ?? (await getFileBlob(fileRef.id));
  if (!blob) {
    throw new Error(
      `„${kind}“: Datei konnte nicht gelesen werden. Bitte erneut auswählen.`,
    );
  }
  const nameForExt = rawFile?.name ?? fileRef.name;
  const ext = nameForExt.includes(".")
    ? nameForExt.slice(nameForExt.lastIndexOf("."))
    : "";
  const base =
    kind === "photo" ? "photo" : kind === "cv" ? "cv" : "cover-letter";
  const path = `${personId}/${base}${ext}`;
  const contentType =
    rawFile?.type || fileRef.type || "application/octet-stream";
  const { error } = await supabase.storage
    .from(PERSON_FILES_BUCKET)
    .upload(path, blob, {
      upsert: true,
      contentType: contentType || undefined,
    });
  if (error) {
    throw new Error(uploadErrorHint(`${kind}: ${error.message}`));
  }
  return {
    path,
    originalName: rawFile?.name ?? fileRef.name,
  };
}

async function removeStoragePaths(paths: string[]): Promise<void> {
  const cleaned = paths.filter(Boolean);
  if (cleaned.length === 0) return;
  await supabase.storage.from(PERSON_FILES_BUCKET).remove(cleaned);
}

export async function insertPersonRemote(
  data: Omit<Person, "id" | "createdAt" | "companyId" | "status">,
  uploadFiles?: PersonUploadFiles,
): Promise<Person> {
  const { data: row, error } = await supabase
    .from("persons")
    .insert({
      first_name: data.firstName,
      last_name: data.lastName,
      birth_date: data.birthDate ?? null,
      job_wish: data.jobWish,
      notes: data.notes ?? null,
      status: "available",
      company_id: null,
    })
    .select()
    .single();
  if (error) throw error;
  const personId = (row as PersonRow).id;

  let photo_path: string | null = null;
  let photo_original_name: string | null = null;
  let cv_path: string | null = null;
  let cv_original_name: string | null = null;
  let cover_letter_path: string | null = null;
  let cover_letter_original_name: string | null = null;

  if (data.photo) {
    const up = await uploadAttachment(
      personId,
      "photo",
      data.photo,
      uploadFiles?.photo,
    );
    photo_path = up.path;
    photo_original_name = up.originalName;
  }
  if (data.cv) {
    const up = await uploadAttachment(
      personId,
      "cv",
      data.cv,
      uploadFiles?.cv,
    );
    cv_path = up.path;
    cv_original_name = up.originalName;
  }
  if (data.coverLetter) {
    const up = await uploadAttachment(
      personId,
      "coverLetter",
      data.coverLetter,
      uploadFiles?.coverLetter,
    );
    cover_letter_path = up.path;
    cover_letter_original_name = up.originalName;
  }

  if (
    photo_path ||
    cv_path ||
    cover_letter_path
  ) {
    const { data: updated, error: uErr } = await supabase
      .from("persons")
      .update({
        photo_path,
        photo_original_name,
        cv_path,
        cv_original_name,
        cover_letter_path,
        cover_letter_original_name,
      })
      .eq("id", personId)
      .select()
      .single();
    if (uErr) throw uErr;
    return mapPersonRow(updated as PersonRow);
  }

  return mapPersonRow(row as PersonRow);
}

export async function updatePersonRemote(
  id: string,
  patch: Partial<Person>,
  uploadFiles?: PersonUploadFiles,
): Promise<void> {
  const { data: current, error: fetchErr } = await supabase
    .from("persons")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchErr) throw fetchErr;
  const cur = current as PersonRow;

  const row: Record<string, unknown> = {};
  if (patch.firstName !== undefined) row.first_name = patch.firstName;
  if (patch.lastName !== undefined) row.last_name = patch.lastName;
  if (patch.birthDate !== undefined) row.birth_date = patch.birthDate ?? null;
  if (patch.jobWish !== undefined) row.job_wish = patch.jobWish;
  if (patch.notes !== undefined) row.notes = patch.notes ?? null;
  if (patch.companyId !== undefined) row.company_id = patch.companyId;
  if (patch.status !== undefined) row.status = patch.status;

  const pathsToRemove: string[] = [];

  async function applyFile(
    key: "photo" | "cv" | "coverLetter",
    pathCol: "photo_path" | "cv_path" | "cover_letter_path",
    nameCol:
      | "photo_original_name"
      | "cv_original_name"
      | "cover_letter_original_name",
  ) {
    if (!(key in patch)) return;
    const val = patch[key];
    const oldPath = cur[pathCol];
    const raw = uploadFiles?.[key];
    if (!val) {
      if (oldPath) pathsToRemove.push(oldPath);
      row[pathCol] = null;
      row[nameCol] = null;
      return;
    }
    if (val.storagePath && !raw) {
      if (oldPath && oldPath !== val.storagePath) pathsToRemove.push(oldPath);
      row[pathCol] = val.storagePath;
      row[nameCol] = val.name;
      return;
    }
    if (oldPath) pathsToRemove.push(oldPath);
    const up = await uploadAttachment(
      id,
      key === "photo" ? "photo" : key === "cv" ? "cv" : "coverLetter",
      val,
      raw,
    );
    row[pathCol] = up.path;
    row[nameCol] = up.originalName;
  }

  await applyFile("photo", "photo_path", "photo_original_name");
  await applyFile("cv", "cv_path", "cv_original_name");
  await applyFile("coverLetter", "cover_letter_path", "cover_letter_original_name");

  await removeStoragePaths(pathsToRemove);

  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from("persons").update(row).eq("id", id);
  if (error) throw error;
}

export async function deletePersonRemote(person: Person): Promise<void> {
  const paths = [
    person.photo?.storagePath,
    person.cv?.storagePath,
    person.coverLetter?.storagePath,
  ].filter(Boolean) as string[];
  await removeStoragePaths(paths);
  const { error } = await supabase.from("persons").delete().eq("id", person.id);
  if (error) throw error;
}

