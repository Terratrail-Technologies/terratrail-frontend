import { useState, useEffect } from "react";
import { Search, Filter, Plus, MoreVertical, FileText, CheckCircle2, Users as UsersIcon, Loader2 } from "lucide-react";
import { api } from "../services/api";
import { customers as mockCustomers } from "../utils/mockData";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { motion } from "motion/react";
import { EmptyState } from "../components/ui/empty-state";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
} as const;
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 26 } },
} as const;

// Deterministic avatar color from name
const avatarColors = [
  ["bg-emerald-100", "text-emerald-700"],
  ["bg-blue-100",    "text-blue-700"],
  ["bg-violet-100",  "text-violet-700"],
  ["bg-amber-100",   "text-amber-700"],
  ["bg-rose-100",    "text-rose-700"],
  ["bg-cyan-100",    "text-cyan-700"],
];
const avatarColor = (name: string) =>
  avatarColors[name.charCodeAt(0) % avatarColors.length];

export function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await api.customers.list();
      setCustomers(data);
    } catch (err) {
      console.warn("Using mock customers fallback");
      setCustomers(mockCustomers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fmt = (n: number | string) => `₦${Number(n).toLocaleString("en-NG")}`;

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-[calc(100vh-60px)] w-full">
      {/* Page header */}
      <div className="bg-white border-b border-neutral-100 px-6 lg:px-8 py-5 hidden md:block">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-[18px] font-semibold text-neutral-900 tracking-tight">Customers</h1>
              <p className="text-[12.5px] text-neutral-400 mt-0.5">Customer and subscription management</p>
            </div>
            {loading && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />}
          </div>
          <Button className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-medium rounded-lg px-3 shadow-sm">
            <Plus className="w-3.5 h-3.5" />
            Add Customer
          </Button>
        </div>
      </div>

      <motion.div variants={container} initial="hidden" animate="show"
        className="p-4 sm:p-6 lg:p-8 space-y-5 flex-1">

        {loading && customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-[13px] text-neutral-400 font-medium mt-3">Loading customers...</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div variants={item}>
            <EmptyState
              icon={UsersIcon}
              title={search ? "No matching customers" : "No customers yet"}
              description={search ? "Adjust your search to find what you're looking for." : "Add your first customer to start tracking subscriptions and revenue."}
              action={
                <Button 
                  onClick={() => search ? setSearch("") : null}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Plus className="w-4 h-4" />
                  {search ? "Clear Search" : "Add New Customer"}
                </Button>
              }
            />
          </motion.div>
        ) : (
          <>
            {/* Search + filter bar */}
            <motion.div variants={item} className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                <Input 
                  placeholder="Search by name or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 pl-9 text-[13px] bg-white border-neutral-200 focus-visible:ring-1 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-400 rounded-lg" 
                />
              </div>
              <Button variant="outline" size="sm"
                className="h-9 gap-1.5 text-[12.5px] bg-white border-neutral-200 hover:bg-neutral-50 rounded-lg px-3">
                <Filter className="w-3.5 h-3.5" />
                Filter
              </Button>
            </motion.div>

            {/* Table */}
            <motion.div variants={item}
              className="bg-white rounded-xl border border-neutral-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50/70">
                      {["Customer", "Contact", "Subscriptions", "Status", "Total Revenue", "Rep", ""].map((col, i) => (
                        <th key={col || i}
                          className={[
                            "px-5 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase",
                            col === "Contact"       ? "hidden sm:table-cell"  : "",
                            col === "Subscriptions" ? "hidden md:table-cell"  : "",
                            col === "Total Revenue" ? "hidden lg:table-cell"  : "",
                            col === "Rep"           ? "hidden xl:table-cell"  : "",
                            col === ""              ? "text-right"            : "",
                          ].join(" ")}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {filtered.map((customer) => {
                      const [bgCls, txtCls] = avatarColor(customer.name);
                      const status = (customer.status || "active").toLowerCase();
                      return (
                        <tr key={customer.id}
                          className="hover:bg-neutral-50/60 transition-colors group">

                          {/* Customer */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-full ${bgCls} ${txtCls} flex items-center justify-center text-[11px] font-bold uppercase shrink-0`}>
                                {customer.name.substring(0, 2)}
                              </div>
                              <div>
                                <div className="text-[13px] font-semibold text-neutral-900">{customer.name}</div>
                                <div className="text-[11px] text-neutral-400 mt-0.5 sm:hidden">{customer.email}</div>
                                <div className="text-[11px] text-neutral-400 mt-0.5 hidden sm:block">Joined {customer.joinedAt || "N/A"}</div>
                              </div>
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="px-5 py-3.5 whitespace-nowrap hidden sm:table-cell">
                            <div className="text-[12.5px] text-neutral-700">{customer.email}</div>
                            <div className="text-[11px] text-neutral-400 mt-0.5">{customer.phone}</div>
                          </td>

                          {/* Subscriptions */}
                          <td className="px-5 py-3.5 whitespace-nowrap hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-md bg-neutral-100 group-hover:bg-white transition-colors border border-transparent group-hover:border-neutral-100">
                                <FileText className="w-3.5 h-3.5 text-neutral-400" />
                              </div>
                              <div>
                                <div className="text-[12.5px] font-semibold text-neutral-900">{customer.subscriptions ?? customer.subscription_count ?? 0} total</div>
                                <div className="text-[11px] text-neutral-400">{customer.activeSubscriptions ?? customer.active_subscription_count ?? 0} active</div>
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <Badge variant={status === "active" ? "default" : "secondary"}
                              className={
                                status === "active"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100 text-[11px] gap-1.5"
                                  : status === "completed"
                                  ? "bg-blue-50 text-blue-700 border-blue-100 text-[11px] gap-1.5"
                                  : "text-[11px] gap-1.5"
                              }>
                              {status === "active" && (
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                              )}
                              {status === "completed" && (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                              <span className="capitalize">{status}</span>
                            </Badge>
                          </td>

                          {/* Revenue */}
                          <td className="px-5 py-3.5 whitespace-nowrap hidden lg:table-cell">
                            <div className="text-[13px] font-semibold text-neutral-900">{fmt(customer.totalRevenue ?? customer.total_revenue ?? 0)}</div>
                          </td>

                          {/* Rep */}
                          <td className="px-5 py-3.5 whitespace-nowrap hidden xl:table-cell">
                            <div className="flex items-center gap-1.5 text-[12.5px] text-neutral-600">
                              <div className="w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center text-[9px] font-bold text-neutral-500">
                                {(customer.customerRep || customer.rep_name || "U").substring(0, 1)}
                              </div>
                              {customer.customerRep || customer.rep_name || "N/A"}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 whitespace-nowrap text-right">
                            <Button variant="ghost" size="icon"
                              className="h-7 w-7 text-neutral-300 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}
