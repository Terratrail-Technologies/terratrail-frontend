import { useState } from "react";
import { usePolling } from "../hooks/usePolling";
import { Download, MapPin, Calendar, Users, CheckCircle2, Clock, Loader2, ClipboardList } from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import { api } from "../services/api";
import { Badge } from "../components/ui/badge";
import { EmptyState } from "../components/ui/empty-state";

export function SiteInspection() {
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInspections = async () => {
    setLoading(true);
    try {
      const data = await api.siteInspections.list();
      setInspections(data);
    } catch {
      setInspections([]);
    } finally {
      setLoading(false);
    }
  };

  usePolling(fetchInspections, 30_000);

  const attended = inspections.filter((i) => i.status === "ATTENDED").length;
  const upcoming = inspections.filter((i) => i.status === "PENDING").length;
  const totalPersons = inspections.reduce((sum, i) => sum + (i.persons ?? 0), 0);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">
                Site Inspection Requests {!loading && `(${inspections.length})`}
              </h1>
              <p className="text-sm text-neutral-500 mt-1">All requests across all properties</p>
            </div>
            {loading && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />}
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-sm font-medium">
            <Download className="w-4 h-4" />
            Download CSV
          </button>
        </div>
      </div>

      <div className="p-8">
        {loading && inspections.length === 0 ? (
          /* Skeleton */
          <>
            <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
              <div className="divide-y divide-neutral-100">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="px-6 py-4 flex items-center gap-6">
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-32 bg-neutral-100" />
                      <Skeleton className="h-3 w-24 bg-neutral-100" />
                    </div>
                    <Skeleton className="h-4 w-28 bg-neutral-100" />
                    <Skeleton className="h-4 w-20 bg-neutral-100" />
                    <Skeleton className="h-5 w-16 rounded-full bg-neutral-100" />
                    <Skeleton className="h-5 w-16 rounded-full bg-neutral-100" />
                    <Skeleton className="h-4 w-8 bg-neutral-100" />
                    <Skeleton className="h-5 w-20 rounded-full bg-neutral-100 ml-auto" />
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-6 mt-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-neutral-200 p-6">
                  <Skeleton className="h-3.5 w-24 bg-neutral-100 mb-3" />
                  <Skeleton className="h-9 w-12 bg-neutral-100" />
                </div>
              ))}
            </div>
          </>
        ) : inspections.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No site inspection requests"
            description="Inspection requests submitted by customers will appear here."
          />
        ) : (
          <>
            {/* Table */}
            <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      {["Contact", "Property", "Date & Time", "Type", "Category", "Persons", "Status"].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {inspections.map((inspection) => (
                      <tr key={inspection.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-neutral-900">{inspection.contact?.name ?? inspection.name}</div>
                          <div className="text-sm text-neutral-500">{inspection.contact?.phone ?? inspection.phone}</div>
                          <div className="text-sm text-neutral-500">{inspection.contact?.email ?? inspection.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-neutral-400" />
                            <span className="text-sm font-medium text-neutral-900">
                              {inspection.property_display || inspection.property_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-neutral-400" />
                            <div>
                              <div className="text-sm font-medium text-neutral-900">{inspection.inspection_date}</div>
                              <div className="text-sm text-neutral-500">{inspection.inspection_time ?? "—"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="secondary">{inspection.inspection_type}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="secondary">{inspection.category}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-neutral-400" />
                            <span className="text-sm font-medium text-neutral-900">{inspection.persons}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {inspection.status === "ATTENDED" ? (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Attended
                            </Badge>
                          ) : inspection.status === "CANCELLED" ? (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 gap-1">
                              <Clock className="w-3 h-3" /> Cancelled
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 gap-1">
                              <Clock className="w-3 h-3" /> Pending
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-6 mt-8">
              {[
                { label: "Total Requests", value: inspections.length },
                { label: "Completed",      value: attended },
                { label: "Upcoming",       value: upcoming },
                { label: "Total Persons",  value: totalPersons },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-lg border border-neutral-200 p-6">
                  <div className="text-sm text-neutral-500 mb-1">{s.label}</div>
                  <div className="text-3xl font-semibold text-neutral-900">{s.value}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
