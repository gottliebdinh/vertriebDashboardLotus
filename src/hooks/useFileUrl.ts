import { useEffect, useState } from "react";
import { getFileUrl } from "../db/database";
import { isSupabaseConfigured } from "../lib/supabaseConfigured";
import { PERSON_FILES_BUCKET } from "../lib/storageBucket";
import { supabase } from "../lib/supabase";
import type { FileRef } from "../types";

/** URL für Anhang: Supabase signierte URL oder lokales Blob aus IndexedDB. */
export function useFileRefUrl(ref?: FileRef | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!ref?.id) {
      setUrl(null);
      return;
    }

    if (ref.storagePath && isSupabaseConfigured()) {
      supabase.storage
        .from(PERSON_FILES_BUCKET)
        .createSignedUrl(ref.storagePath, 60 * 60 * 12)
        .then(({ data, error }) => {
          if (!active) return;
          if (error || !data?.signedUrl) {
            setUrl(null);
            return;
          }
          setUrl(data.signedUrl);
        });
      return () => {
        active = false;
      };
    }

    let createdUrl: string | null = null;
    getFileUrl(ref.id).then((u) => {
      if (!active) {
        if (u) URL.revokeObjectURL(u);
        return;
      }
      createdUrl = u;
      setUrl(u);
    });

    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [ref?.id, ref?.storagePath]);

  return url;
}

/** @deprecated Nutze useFileRefUrl mit FileRef */
export function useFileUrl(fileId: string | undefined | null): string | null {
  return useFileRefUrl(
    fileId ? { id: fileId, name: "", type: "", size: 0 } : null,
  );
}
