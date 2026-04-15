import { Search, Filter, Plus, MoreVertical, FileText, CheckCircle2, Users as UsersIcon } from "lucide-react";
import { customers } from "../utils/mockData";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { motion } from "motion/react";
import { EmptyState } from "../components/ui/empty-state";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 26 } },
};

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
  const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;

  return (
    <div className="flex flex-col min-h-[calc(100vh-60px)] w-full">
      {/* Page header */}
      <div className="bg-white border-b border-neutral-100 px-6 lg:px-8 py-5 hidden md:block">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[18px] font-semibold text-neutral-900 tracking-tight">Customers</h1>
            <p className="text-[12.5px] text-neutral-400 mt-0.5">Customer and subscription management</p>
          </div>
          <Button className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-medium rounded-lg px-3 shadow-sm">
            <Plus className="w-3.5 h-3.5" />
            Add Customer
          </Button>
        </div>
      </div>

      <motion.div variants={container} initial="hidden" animate="show"
        className="p-4 sm:p-6 lg:p-8 space-y-5 flex-1">

        {customers.length === 0 ? (
          <motion.div variants={item}>
            <EmptyState
              icon={UsersIcon}
              title="No customers yet"
              description="Add your first customer to start tracking subscriptions and revenue."
              action={
                <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="w-4 h-4" />
                  Add New Customer
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
                <Input placeholder="Search by name or email…"
                  className="h-9 pl-9 text-[13px] bg-white border-neutral-200 focus-visible:ring-1 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-400 rounded-lg" />
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
                    {customers.map((customer) => {
                      const [bgCls, txtCls] = avatarColor(customer.name);
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
                                <div className="text-[11px] text-neutral-400 mt-0.5 hidden sm:block">Joined {customer.joinedAt}</div>
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
                                <div className="text-[12.5px] font-semibold text-neutral-900">{customer.subscriptions} total</div>
                                <div className="text-[11px] text-neutral-400">{customer.activeSubscriptions} active</div>
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <Badge variant={customer.status === "active" ? "default" : "secondary"}
                              className={
                                customer.status === "active"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100 text-[11px] gap-1.5"
                                  : customer.status === "completed"
                                  ? "bg-blue-50 text-blue-700 border-blue-100 text-[11px] gap-1.5"
                                  : "text-[11px] gap-1.5"
                              }>
                              {customer.status === "active" && (
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                              )}
                              {customer.status === "completed" && (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                              <span className="capitalize">{customer.status}</span>
                            </Badge>
                          </td>

                          {/* Revenue */}
                          <td className="px-5 py-3.5 whitespace-nowrap hidden lg:table-cell">
                            <div className="text-[13px] font-semibold text-neutral-900">{fmt(customer.totalRevenue)}</div>
                          </td>

                          {/* Rep */}
                          <td className="px-5 py-3.5 whitespace-nowrap hidden xl:table-cell">
                            <div className="flex items-center gap-1.5 text-[12.5px] text-neutral-600">
                              <div className="w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center text-[9px] font-bold text-neutral-500">
                                {customer.customerRep?.substring(0, 1)}
                              </div>
                              {customer.customerRep}
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
