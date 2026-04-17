import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Loader2, ExternalLink } from "lucide-react";
import { api } from "../../../services/api";
import { Badge } from "../../../components/ui/badge";

const CATEGORY_COLORS: Record<string, string> = {
  payment:      "bg-emerald-50 text-emerald-700",
  property:     "bg-blue-50 text-blue-700",
  customer:     "bg-violet-50 text-violet-700",
  subscription: "bg-amber-50 text-amber-700",
  settings:     "bg-neutral-100 text-neutral-600",
};

export function ActivityLogs() {
  const [logs,    setLogs]    = useState<any[]>([]);
  const [count,   setCount]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback((p = 1) => {
    setLoading(true);
    api.workspaces.activity(p)
      .then((data: any) => {
        const items = Array.isArray(data) ? data : (data.results ?? []);
        setLogs(items);
        setCount(data.count ?? items.length);
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchLogs(page); }, [fetchLogs, page]);

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-neutral-900">Activity Logs</h2>
          <p className="text-sm text-neutral-500 mt-0.5">Track all actions in your workspace</p>
        </div>
        <button
          onClick={() => fetchLogs(page)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 text-neutral-700 rounded-md hover:bg-neutral-50 transition-colors text-sm disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </button>
      </div>

      {loading && logs.length === 0 ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-500" />
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-lg border border-neutral-200 py-16 text-center text-sm text-neutral-400">
          No activity recorded yet.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-neutral-200 divide-y divide-neutral-100">
          {logs.map((log) => {
            const actor = log.actor
              ? [log.actor.first_name, log.actor.last_name].filter(Boolean).join(" ") || "System"
              : "System";
            const initials = actor.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
            const cat = (log.category ?? "").toLowerCase();

            return (
              <div key={log.id} className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold text-emerald-700">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-neutral-900">
                          <span className="font-semibold">{actor}</span>{" "}
                          <span className="text-neutral-600">{log.action_text}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {cat && (
                            <Badge className={`text-[11px] ${CATEGORY_COLORS[cat] ?? "bg-neutral-100 text-neutral-500"}`}>
                              {cat}
                            </Badge>
                          )}
                          {log.link && (
                            <a
                              href={log.link}
                              className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700"
                            >
                              View <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-neutral-400 whitespace-nowrap shrink-0">
                        {log.created_at
                          ? new Date(log.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-neutral-600">
          <span>Showing page {page} of {totalPages} ({count} total)</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-md border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-md border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
