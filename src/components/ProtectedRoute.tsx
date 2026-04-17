import { Navigate, Outlet, useLocation } from "react-router";

function isAuthenticated(): boolean {
  try {
    const stored = localStorage.getItem("tt_auth");
    if (!stored || stored === "undefined" || stored === "null") return false;
    const t = JSON.parse(stored);
    return !!t?.access;
  } catch {
    return false;
  }
}

export function ProtectedRoute() {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/auth/sign-in" state={{ from: location }} replace />;
  }
  return <Outlet />;
}
