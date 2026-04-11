import { Download, MapPin, Calendar, Users, CheckCircle2, Clock } from "lucide-react";
import { siteInspections } from "../utils/mockData";
import { Badge } from "../components/ui/badge";

export function SiteInspection() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">
              Site Inspection Requests ({siteInspections.length})
            </h1>
            <p className="text-sm text-neutral-500 mt-1">All requests across all properties</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors">
            <Download className="w-4 h-4" />
            Download CSV
          </button>
        </div>
      </div>

      <div className="p-8">
        {/* Inspections Table */}
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Persons
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {siteInspections.map((inspection) => {
                  const isUpcoming = inspection.status === "upcoming";
                  const daysUntil = new Date(inspection.date).getDate() - new Date().getDate();

                  return (
                    <tr key={inspection.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-neutral-900">{inspection.contact.name}</div>
                          <div className="text-sm text-neutral-500">{inspection.contact.phone}</div>
                          <div className="text-sm text-neutral-500">{inspection.contact.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-neutral-400" />
                          <span className="text-sm font-medium text-neutral-900">{inspection.property}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-neutral-400" />
                          <div>
                            <div className="text-sm font-medium text-neutral-900">{inspection.date}</div>
                            <div className="text-sm text-neutral-500">{inspection.time}</div>
                            {isUpcoming && daysUntil <= 4 && (
                              <div className="text-xs text-amber-600 mt-1">In {daysUntil} days</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="secondary">{inspection.type}</Badge>
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
                        {inspection.attended ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Attended
                            </div>
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Pending
                            </div>
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-6 mt-8">
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="text-sm text-neutral-500 mb-1">Total Requests</div>
            <div className="text-3xl font-semibold text-neutral-900">{siteInspections.length}</div>
          </div>
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="text-sm text-neutral-500 mb-1">Completed</div>
            <div className="text-3xl font-semibold text-neutral-900">
              {siteInspections.filter((i) => i.attended).length}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="text-sm text-neutral-500 mb-1">Upcoming</div>
            <div className="text-3xl font-semibold text-neutral-900">
              {siteInspections.filter((i) => i.status === "upcoming").length}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="text-sm text-neutral-500 mb-1">Total Persons</div>
            <div className="text-3xl font-semibold text-neutral-900">
              {siteInspections.reduce((sum, i) => sum + i.persons, 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
