import { useEffect, useState } from "react";
import { getFileUrl } from "../db/database";

/** Resolves a stored file id to an object URL and revokes it on unmount. */
export function useFileUrl(fileId: string | undefined | null) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    if (!fileId) {
      setUrl(null);
      return;
    }

    getFileUrl(fileId).then((u) => {
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
  }, [fileId]);

  return url;
}
