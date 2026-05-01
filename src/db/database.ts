import { openDB, type IDBPDatabase } from "idb";
import { nanoid } from "nanoid";
import type { FileRef } from "../types";

/** Current IndexedDB name (PDFs / images). */
const DB_NAME = "lotus-eagle-dashboard";
/** Previous name — files are copied once on first run. */
const LEGACY_DB_NAME = "dashboard-gevin";
const DB_VERSION = 1;
const FILES_STORE = "files";

let dbPromise: Promise<IDBPDatabase> | null = null;
let migrationDone = false;

/** One-time copy of blobs from the old database name so existing uploads keep working. */
export async function migrateLegacyIndexedDB(): Promise<void> {
  if (migrationDone) return;
  migrationDone = true;

  let legacy: IDBPDatabase | undefined;
  try {
    legacy = await openDB(LEGACY_DB_NAME, DB_VERSION);
  } catch {
    return;
  }

  const target = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(FILES_STORE)) {
        db.createObjectStore(FILES_STORE);
      }
    },
  });

  const keys = await legacy.getAllKeys(FILES_STORE);
  for (const key of keys) {
    const id = key as string;
    const val = await legacy.get(FILES_STORE, id);
    if (val && !(await target.get(FILES_STORE, id))) {
      await target.put(FILES_STORE, val, id);
    }
  }
  legacy.close();
}

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(FILES_STORE)) {
          db.createObjectStore(FILES_STORE);
        }
      },
    });
  }
  return dbPromise;
}

/** Stores a File/Blob in IndexedDB and returns a FileRef. */
export async function saveFile(file: File): Promise<FileRef> {
  const db = await getDb();
  const id = nanoid();
  await db.put(FILES_STORE, file, id);
  return {
    id,
    name: file.name,
    type: file.type,
    size: file.size,
  };
}

export async function getFileBlob(id: string): Promise<Blob | undefined> {
  const db = await getDb();
  return (await db.get(FILES_STORE, id)) as Blob | undefined;
}

export async function deleteFile(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(FILES_STORE, id);
}

/** Creates an object URL for a stored file. */
export async function getFileUrl(id: string): Promise<string | null> {
  const blob = await getFileBlob(id);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}
