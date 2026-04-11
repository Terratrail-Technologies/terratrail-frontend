import { RefreshCw, ExternalLink } from "lucide-react";
import { activityLogs } from "../../../utils/mockData";
import { Badge } from "../../../components/ui/badge";

export function ActivityLogs() {
  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-neutral-900">Activity Logs</h2>
          <p className="text-sm text-neutral-500 mt-1">Track all activities happening in your workspace</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 transition-colors">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Activity List */}
      <div className="bg-white rounded-lg border border-neutral-200 divide-y divide-neutral-200">
        {activityLogs.map((log) => (
          <div key={log.id} className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-emerald-700">
                  {log.user.split(" ").map((n) => n[0]).join("")}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-neutral-900">
                      <span className="font-medium">{log.user}</span> {log.action}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {log.entity}
                      </Badge>
                      <button className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700">
                        View Details
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <span className="text-sm text-neutral-500 whitespace-nowrap">{log.timestamp}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-neutral-600">
        <div>
          Showing 1–{activityLogs.length} of {activityLogs.length}
        </div>
        <div className="flex items-center gap-2">
          <span>Page 1 of 1</span>
        </div>
      </div>

      {/* End of logs */}
      <div className="text-center py-6 text-sm text-neutral-500">
        You've reached the end of activity logs for this workspace.
      </div>
    </div>
  );
}
