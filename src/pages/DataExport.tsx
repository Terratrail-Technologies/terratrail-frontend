import { Users, Calendar, Building2, Badge, FileText, BarChart3, Clock, Download } from "lucide-react";
import { usePageTitle } from "../hooks/usePageTitle";

const exportTypes = [
  { id: "customers", name: "Customer Data", icon: Users, description: "Export all customer information" },
  { id: "bookings", name: "Bookings", icon: Calendar, description: "Export booking records" },
  { id: "properties", name: "Property Data", icon: Building2, description: "Export property details" },
  {
    id: "customer-reps",
    name: "Customer Representatives",
    icon: Badge,
    description: "Export customer rep data",
  },
  {
    id: "transactions",
    name: "Payment Transactions",
    icon: FileText,
    description: "Export transaction history",
  },
  {
    id: "installments",
    name: "Payment Installments",
    icon: FileText,
    description: "Export installment schedules",
  },
  { id: "revenue", name: "Revenue Reports", icon: BarChart3, description: "Export revenue analytics" },
  { id: "activity", name: "Activity Logs", icon: Clock, description: "Export workspace activity" },
];

const exportHistory = [
  {
    id: "1",
    type: "Customer Data",
    date: "2026-04-07",
    time: "14:32",
    fileSize: "2.3 MB",
    format: "CSV",
  },
  {
    id: "2",
    type: "Revenue Reports",
    date: "2026-04-05",
    time: "09:15",
    fileSize: "1.8 MB",
    format: "CSV",
  },
  {
    id: "3",
    type: "Property Data",
    date: "2026-04-03",
    time: "16:45",
    fileSize: "854 KB",
    format: "CSV",
  },
];

export function DataExport() {
  usePageTitle("Data Export");
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-8 py-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Data Export</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Export your workspace data in various formats for analysis and reporting
          </p>
        </div>
      </div>

      <div className="p-8">
        {/* Export Types Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-neutral-900 mb-4">Select Data to Export</h2>
          <div className="grid grid-cols-4 gap-4">
            {exportTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  className="bg-white rounded-lg border border-neutral-200 p-6 text-left hover:border-emerald-500 hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 bg-neutral-50 group-hover:bg-emerald-50 rounded-lg flex items-center justify-center mb-4 transition-colors">
                    <Icon className="w-6 h-6 text-neutral-600 group-hover:text-emerald-600 transition-colors" />
                  </div>
                  <h3 className="font-medium text-neutral-900 mb-1">{type.name}</h3>
                  <p className="text-sm text-neutral-500">{type.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Export History */}
        <div className="bg-white rounded-lg border border-neutral-200">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h3 className="font-medium text-neutral-900">Export History</h3>
            <p className="text-sm text-neutral-500 mt-1">Previously generated files available for re-download</p>
          </div>

          {exportHistory.length > 0 ? (
            <div className="divide-y divide-neutral-200">
              {exportHistory.map((item) => (
                <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-neutral-600" />
                    </div>
                    <div>
                      <div className="font-medium text-neutral-900">{item.type}</div>
                      <div className="text-sm text-neutral-500">
                        {item.date} at {item.time} · {item.fileSize} · {item.format}
                      </div>
                    </div>
                  </div>
                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-md hover:bg-neutral-200 transition-colors">
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="font-medium text-neutral-900 mb-2">No export history yet</h3>
              <p className="text-sm text-neutral-500">Select a data type above to generate your first export</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
