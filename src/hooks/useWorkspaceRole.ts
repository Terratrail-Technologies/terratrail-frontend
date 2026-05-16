import { useState, useEffect } from "react";
import { api } from "../services/api";

export type WorkspaceRole = "OWNER" | "ADMIN" | "SALES_REP" | "CUSTOMER" | "CUSTOMER_REP" | null;

let _cached: WorkspaceRole = null;
const _listeners: Array<(r: WorkspaceRole) => void> = [];

function _notify(role: WorkspaceRole) {
  _cached = role;
  _listeners.forEach((fn) => fn(role));
}

export function useWorkspaceRole() {
  const [role, setRole] = useState<WorkspaceRole>(_cached);
  const [loading, setLoading] = useState(_cached === null);

  useEffect(() => {
    _listeners.push(setRole);
    return () => {
      const idx = _listeners.indexOf(setRole);
      if (idx !== -1) _listeners.splice(idx, 1);
    };
  }, []);

  useEffect(() => {
    if (_cached !== null) { setLoading(false); return; }
    api.workspaces
      .myMembership()
      .then((m) => _notify(m.role as WorkspaceRole))
      .catch(() => _notify(null))
      .finally(() => setLoading(false));
  }, []);

  const isAdmin = role === "OWNER" || role === "ADMIN";
  const isSalesRep = role === "SALES_REP";
  const isCustomer = role === "CUSTOMER";

  return { role, loading, isAdmin, isSalesRep, isCustomer };
}

/** Call this when workspace changes so the cache is invalidated */
export function invalidateRoleCache() {
  _cached = null;
}
