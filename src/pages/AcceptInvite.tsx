import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";

type InviteInfo = {
  email: string;
  role: string;
  workspace_name: string;
  workspace_slug: string;
  is_expired: boolean;
  is_accepted: boolean;
};

export function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    api.workspaces
      .getInvite(token)
      .then(setInvite)
      .catch(() => setError("Invitation not found or has been revoked."))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleAccept() {
    if (!token) return;
    setAccepting(true);
    try {
      const res = await api.workspaces.acceptInvite(token);
      toast.success(`You've joined ${res.workspace_name}!`);
      // Switch to the new workspace then go to overview
      localStorage.setItem("tt_workspace_slug", res.workspace_slug);
      navigate("/", { replace: true });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to accept invitation.");
    } finally {
      setAccepting(false);
    }
  }

  function handleSignIn() {
    // Preserve the invite URL so the user lands back here after login
    navigate(`/auth/sign-in?next=/accept-invite/${token}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <p className="text-neutral-500 text-sm">Loading invitation…</p>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="bg-white rounded-xl border border-neutral-200 p-10 max-w-md w-full text-center space-y-4">
          <div className="text-4xl">🔗</div>
          <h1 className="text-xl font-semibold text-neutral-900">Invitation not found</h1>
          <p className="text-sm text-neutral-500">{error || "This invitation link is invalid."}</p>
          <button
            onClick={() => navigate("/auth/sign-in")}
            className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  if (invite.is_accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="bg-white rounded-xl border border-neutral-200 p-10 max-w-md w-full text-center space-y-4">
          <div className="text-4xl">✅</div>
          <h1 className="text-xl font-semibold text-neutral-900">Already accepted</h1>
          <p className="text-sm text-neutral-500">This invitation has already been used.</p>
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (invite.is_expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="bg-white rounded-xl border border-neutral-200 p-10 max-w-md w-full text-center space-y-4">
          <div className="text-4xl">⏰</div>
          <h1 className="text-xl font-semibold text-neutral-900">Invitation expired</h1>
          <p className="text-sm text-neutral-500">
            This invitation has expired. Ask the workspace owner to send a new one.
          </p>
        </div>
      </div>
    );
  }

  const roleLabel = invite.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="bg-white rounded-xl border border-neutral-200 p-10 max-w-md w-full space-y-6">
        {/* Logo / Brand */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mb-4">
            <span className="text-2xl">🌿</span>
          </div>
          <h1 className="text-xl font-semibold text-neutral-900">You're invited!</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Join <span className="font-medium text-neutral-800">{invite.workspace_name}</span> as{" "}
            <span className="font-medium text-emerald-700">{roleLabel}</span>
          </p>
        </div>

        {/* Invite details */}
        <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500">Workspace</span>
            <span className="font-medium text-neutral-800">{invite.workspace_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Role</span>
            <span className="font-medium text-neutral-800">{roleLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Sent to</span>
            <span className="font-medium text-neutral-800">{invite.email}</span>
          </div>
        </div>

        {user ? (
          user.email.toLowerCase() === invite.email.toLowerCase() ? (
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 transition-colors"
            >
              {accepting ? "Joining…" : `Accept & Join ${invite.workspace_name}`}
            </button>
          ) : (
            <div className="text-center space-y-3">
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                You're signed in as <strong>{user.email}</strong>, but this invite was sent to{" "}
                <strong>{invite.email}</strong>. Sign in with the correct account to accept.
              </p>
              <button
                onClick={handleSignIn}
                className="w-full py-2.5 border border-neutral-300 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
              >
                Sign in with a different account
              </button>
            </div>
          )
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleSignIn}
              className="w-full py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              Sign in to accept
            </button>
            <button
              onClick={() => navigate(`/auth/sign-up?next=/accept-invite/${token}&email=${encodeURIComponent(invite.email)}`)}
              className="w-full py-2.5 border border-neutral-300 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
            >
              Create an account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
