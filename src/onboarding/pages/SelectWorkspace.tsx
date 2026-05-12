import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Building2, ChevronRight, Loader2, LogOut } from "lucide-react";
import { api } from "../../services/api";
import s from "../styles/onboarding.module.css";

const PLAN_LABEL: Record<string, string> = {
  FREE: "Free", STARTER: "Starter", GROWTH: "Growth", SCALE: "Scale", ENTERPRISE: "Enterprise",
};
const PLAN_COLOR: Record<string, string> = {
  FREE: "#6b7280", STARTER: "#2563eb", GROWTH: "#059669", SCALE: "#7c3aed", ENTERPRISE: "#d97706",
};
const ROLE_LABEL: Record<string, string> = {
  OWNER: "Owner", ADMIN: "Admin", SALES_REP: "Sales Rep",
  CUSTOMER: "Customer", CUSTOMER_REP: "Customer Rep",
};

export function SelectWorkspace() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    api.workspaces.mine()
      .then((data: any) => setWorkspaces(Array.isArray(data) ? data : []))
      .catch(() => setWorkspaces([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (ws: any) => {
    localStorage.setItem("tt_workspace_slug", ws.slug);
    localStorage.removeItem("tt_workspace");
    navigate("/", { replace: true });
  };

  const handleLogout = () => {
    ["tt_auth", "tt_user", "tt_workspace_slug", "tt_workspace"].forEach((k) =>
      localStorage.removeItem(k)
    );
    navigate("/auth/sign-in", { replace: true });
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
        <h1 className={s.heading}>Select Workspace</h1>
        <p className={s.subtext}>You belong to multiple workspaces. Choose one to continue.</p>
      </motion.div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <Loader2 style={{ width: 22, height: 22, color: "#94a3b8", display: "inline-block", animation: "spin 0.65s linear infinite" }} />
        </div>
      ) : workspaces.length === 0 ? (
        <div className={s.infoBox} style={{ marginTop: 16 }}>
          No workspaces found. Ask your administrator to invite you or create a new workspace.
        </div>
      ) : (
        <motion.div
          style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 20 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.22 }}
        >
          {workspaces.map((ws, i) => (
            <motion.button
              key={ws.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.2 }}
              onClick={() => handleSelect(ws)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "11px 14px", background: "#fff",
                border: "1.5px solid #e5e7eb", borderRadius: 10,
                cursor: "pointer", textAlign: "left",
                transition: "border-color 0.15s, box-shadow 0.15s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#10b981";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px rgba(16,185,129,0.1)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
              }}
            >
              {/* Logo / icon */}
              <div style={{
                width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                background: "#f0fdf4", overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {ws.logo ? (
                  <img src={ws.logo} alt={ws.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <Building2 style={{ width: 17, height: 17, color: "#10b981" }} />
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {ws.name}
                </p>
                <p style={{ fontSize: 11, color: "#6b7280", margin: "2px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontWeight: 600, color: PLAN_COLOR[ws.billing_plan] ?? "#6b7280" }}>
                    {PLAN_LABEL[ws.billing_plan] ?? ws.billing_plan ?? "Free"}
                  </span>
                  <span style={{ color: "#d1d5db" }}>·</span>
                  <span>{ROLE_LABEL[ws.role] ?? ws.role ?? "Member"}</span>
                </p>
              </div>

              <ChevronRight style={{ width: 14, height: 14, color: "#9ca3af", flexShrink: 0 }} />
            </motion.button>
          ))}
        </motion.div>
      )}

      <button
        onClick={handleLogout}
        style={{
          marginTop: 24, display: "flex", alignItems: "center", justifyContent: "center",
          gap: 6, width: "100%", padding: "9px 0", background: "transparent",
          border: "none", cursor: "pointer", fontSize: 12.5, color: "#ef4444", fontWeight: 600,
        }}
      >
        <LogOut style={{ width: 13, height: 13 }} />
        Sign out
      </button>
    </>
  );
}
