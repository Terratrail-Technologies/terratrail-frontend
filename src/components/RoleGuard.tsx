import { Navigate, Outlet } from "react-router";
import { useWorkspaceRole } from "../hooks/useWorkspaceRole";

interface RoleGuardProps {
  allowed: string[];
  redirectTo?: string;
}

export function RoleGuard({ allowed, redirectTo = "/" }: RoleGuardProps) {
  const { role, loading } = useWorkspaceRole();

  // While role is loading, render nothing to prevent flash
  if (loading) return null;

  // null role = workspace membership not resolved yet; let it pass for now
  if (role === null) return <Outlet />;

  if (!allowed.includes(role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
