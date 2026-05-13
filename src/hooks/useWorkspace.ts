/**
 * useWorkspace — fetches and caches workspace details from /workspaces/detail/.
 * Falls back to localStorage slug if the API is unavailable.
 */
import { useState, useEffect } from "react";
import { api } from "../services/api";

function getCachedWorkspace(): any | null {
  try {
    const s = localStorage.getItem("tt_workspace");
    if (!s || s === "undefined" || s === "null") return null;
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function cacheWorkspace(data: any) {
  if (data && typeof data === "object") {
    localStorage.setItem("tt_workspace", JSON.stringify(data));
  }
}

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<any>(getCachedWorkspace);

  useEffect(() => {
    api.workspaces.detail()
      .then((data) => {
        if (data && typeof data === "object" && data.name) {
          cacheWorkspace(data);
          setWorkspace(data);
        }
      })
      .catch(() => { /* keep cached */ });
  }, []);

  const slug = workspace?.slug || localStorage.getItem("tt_workspace_slug") || "";
  const name = workspace?.name || slug || "Terratrail";
  // e.g. "dukiya.terratrail.app" — adjust domain as needed
  const domain = slug ? `${slug}.terratrail.app` : null;

  return { workspace, name, slug, domain };
}
