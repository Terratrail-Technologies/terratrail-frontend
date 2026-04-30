import { useState, useEffect } from "react";
import { Search, Mail, UserPlus, Loader2, X, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../services/api";
import { Badge } from "../../../components/ui/badge";
import { usePageTitle } from "../../../hooks/usePageTitle";

const ROLE_COLORS: Record<string, string> = {
  OWNER:      "bg-purple-50 text-purple-700",
  ADMIN:      "bg-blue-50 text-blue-700",
  SALES_REP:  "bg-emerald-50 text-emerald-700",
  CUSTOMER:   "bg-neutral-100 text-neutral-600",
};

export function PeopleSettings() {
  usePageTitle("People & Teams");
  const [members, setMembers]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search,  setSearch]    = useState("");

  // Invite modal state
  const [showInvite,  setShowInvite]  = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole,  setInviteRole]  = useState("ADMIN");
  const [inviting,    setInviting]    = useState(false);
  const [inviteLink,  setInviteLink]  = useState<string | null>(null);
  const [linkCopied,  setLinkCopied]  = useState(false);

  const fetchMembers = () => {
    setLoading(true);
    api.workspaces.listMembers()
      .then(setMembers)
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMembers();
    // Poll every 30s for real-time updates
    const interval = setInterval(fetchMembers, 30_000);
    // Refetch when tab regains focus
    const onFocus = () => fetchMembers();
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(interval); window.removeEventListener("focus", onFocus); };
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await api.workspaces.invite({ email: inviteEmail.trim(), role: inviteRole });
      toast.success(`Invitation sent to ${inviteEmail}`);
      if (res?.token) {
        setInviteLink(`${window.location.origin}/accept-invite/${res.token}`);
      } else {
        setInviteEmail("");
        setShowInvite(false);
      }
      fetchMembers();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to send invitation.");
    } finally {
      setInviting(false);
    }
  };

  const copyInviteLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1500);
    });
  };

  const closeInviteModal = () => {
    setShowInvite(false);
    setInviteEmail("");
    setInviteLink(null);
    setLinkCopied(false);
  };

  // Serializer returns flat fields: user_name, user_email (not nested user object)
  const filtered = members.filter((m) => {
    const name  = (m.user_name  ?? "").toLowerCase();
    const email = (m.user_email ?? "").toLowerCase();
    return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
  });

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowInvite(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-sm font-medium"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                {["Name", "Email", "Role", "Joined"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-neutral-400 italic">
                    {search ? "No matching members." : "No members found."}
                  </td>
                </tr>
              ) : filtered.map((m) => {
                const name = m.user_name || "—";
                const email = m.user_email || "—";
                const role = m.role ?? "ADMIN";
                const initials = name !== "—"
                  ? name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
                  : "?";
                return (
                  <tr key={m.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-[11px] font-bold text-emerald-700 shrink-0">
                          {initials}
                        </div>
                        <span className="text-sm font-medium text-neutral-900">{name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={`text-xs ${ROLE_COLORS[role] ?? "bg-neutral-100 text-neutral-600"}`}>{role}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {m.created_at ? new Date(m.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" }) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-neutral-900">Invite Team Member</h3>
              <button onClick={closeInviteModal} className="p-1 hover:bg-neutral-100 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteLink ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-sm text-emerald-800">Invitation sent to <strong>{inviteEmail}</strong></p>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500 mb-1.5">Share this link if the email doesn't arrive</p>
                  <div className="flex items-center gap-2">
                    <input readOnly value={inviteLink}
                      className="flex-1 px-3 py-2 text-xs border border-neutral-200 rounded-md bg-neutral-50 text-neutral-600 truncate" />
                    <button onClick={copyInviteLink}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 transition-colors">
                      {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {linkCopied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
                <button onClick={closeInviteModal}
                  className="w-full px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md text-sm transition-colors">
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@company.com"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Role</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="SALES_REP">Customer Rep / Sales Rep</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={closeInviteModal}
                    className="flex-1 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInvite}
                    disabled={inviting || !inviteEmail.trim()}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-60 text-sm transition-colors"
                  >
                    {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    {inviting ? "Sending…" : "Send Invite"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
