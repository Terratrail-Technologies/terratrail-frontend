import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { Bell, RefreshCw, Loader2, Inbox } from "lucide-react";
import { motion } from "motion/react";
import { api } from "../services/api";
import { usePageTitle } from "../hooks/usePageTitle";
import { Button } from "../components/ui/button";

interface NotificationItem {
  id: string;
  type: "inspection" | "customer" | "payment" | "subscription" | "commission";
  title: string;
  subtitle: string;
  time: string;
  href: string;
}

const TYPE_CONFIG: Record<string, { label: string; cls: string }> = {
  inspection:   { label: "Inspection",   cls: "bg-amber-100 text-amber-700" },
  customer:     { label: "Customer",     cls: "bg-blue-100 text-blue-700" },
  payment:      { label: "Payment",      cls: "bg-emerald-100 text-emerald-700" },
  subscription: { label: "Subscription", cls: "bg-violet-100 text-violet-700" },
  commission:   { label: "Commission",   cls: "bg-pink-100 text-pink-700" },
};

const FILTER_TABS = ["All", "Inspection", "Payment", "Subscription", "Customer", "Commission"] as const;
type FilterTab = typeof FILTER_TABS[number];

function relativeTime(iso: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function NotificationsPage() {
  usePageTitle("Notifications");
  const navigate = useNavigate();
  const [items, setItems]       = useState<NotificationItem[]>([]);
  const [loading, setLoading]   = useState(false);
  const [fetched, setFetched]   = useState(false);
  const [filter, setFilter]     = useState<FilterTab>("All");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.workspaces.events();
      const events: NotificationItem[] = (res.events ?? []).map((e: any) => ({
        id: e.id,
        type: e.type as NotificationItem["type"],
        title: e.title,
        subtitle: e.subtitle,
        time: e.created_at ?? "",
        href: e.href ?? "/",
      }));
      setItems(events);
      setFetched(true);
    } catch {
      setItems([]);
      setFetched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  if (!fetched && !loading) { load(); }

  const handleMarkAllSeen = () => {
    localStorage.removeItem("tt_seen_events");
    load();
  };

  const filtered = filter === "All"
    ? items
    : items.filter((n) => n.type === filter.toLowerCase());

  return (
    <div className="flex flex-col min-h-[calc(100vh-60px)]">
      <div className="bg-white border-b border-neutral-100 px-4 sm:px-6 lg:px-8 py-4 md:py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Bell className="size-4 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-[17px] font-semibold text-neutral-900">Notifications</h1>
              <p className="text-[12px] text-neutral-400">{items.length} total events</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleMarkAllSeen}
              className="text-[12px] h-8 gap-1.5 text-neutral-600">
              Mark all seen
            </Button>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}
              className="text-[12px] h-8 gap-1.5">
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 pt-4 border-b border-neutral-100 bg-white">
        <div className="flex items-center gap-0.5">
          {FILTER_TABS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3.5 py-2 text-[12.5px] font-semibold border-b-2 transition-colors ${filter === f ? "border-emerald-500 text-emerald-700" : "border-transparent text-neutral-500 hover:text-neutral-700"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        {loading && !fetched ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-neutral-100 p-4 flex gap-3 animate-pulse">
                <div className="w-16 h-5 rounded-full bg-neutral-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-100 rounded w-48" />
                  <div className="h-3 bg-neutral-100 rounded w-64" />
                </div>
              </div>
            ))}
          </div>
        ) : fetched && filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-neutral-50 flex items-center justify-center mb-4">
              <Inbox className="size-7 text-neutral-300" />
            </div>
            <p className="text-[14px] font-semibold text-neutral-600">No notifications</p>
            <p className="text-[12.5px] text-neutral-400 mt-1">
              {filter !== "All" ? `No ${filter.toLowerCase()} events yet.` : "You're all caught up."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((n, i) => {
              const cfg = TYPE_CONFIG[n.type] ?? { label: n.type, cls: "bg-neutral-100 text-neutral-600" };
              return (
                <motion.button
                  key={n.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => navigate(n.href)}
                  className="w-full bg-white rounded-xl border border-neutral-100 px-4 py-3.5 flex items-start gap-3 hover:shadow-sm hover:border-neutral-200 transition-all text-left"
                >
                  <span className={`text-[9.5px] font-bold uppercase tracking-wide px-2 py-1 rounded-full shrink-0 mt-0.5 ${cfg.cls}`}>
                    {cfg.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-neutral-800 leading-snug">{n.title}</p>
                    <p className="text-[12px] text-neutral-400 mt-0.5 truncate">{n.subtitle}</p>
                  </div>
                  {n.time && (
                    <span className="text-[11px] text-neutral-400 shrink-0 mt-0.5">{relativeTime(n.time)}</span>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
