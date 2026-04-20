import { useState } from "react";
import { usePolling } from "../hooks/usePolling";
import { usePageTitle } from "../hooks/usePageTitle";
import {
  Search, Filter, Plus, MoreVertical, FileText,
  CheckCircle2, Users as UsersIcon, Loader2, X, AlertCircle,
} from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import { api } from "../services/api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { motion } from "motion/react";
import { EmptyState } from "../components/ui/empty-state";
import { toast } from "sonner";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
} as const;
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 26 } },
} as const;

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

// ─── Purchase status config ───────────────────────────────────────────────────
const PURCHASE_STATUSES = [
  { value: "BOOKED",            label: "Booked",            cls: "bg-amber-50 text-amber-700 border-amber-100" },
  { value: "SOLD",              label: "Sold",              cls: "bg-blue-50 text-blue-700 border-blue-100" },
  { value: "PAYMENT_COMPLETED", label: "Payment Completed", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
];

function purchaseStatusConfig(val?: string) {
  return PURCHASE_STATUSES.find((s) => s.value === val);
}

// ─── Add Customer Modal ───────────────────────────────────────────────────────
interface AddCustomerModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function AddCustomerModal({ onClose, onCreated }: AddCustomerModalProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    purchase_status: "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())  e.name  = "Full name is required.";
    if (!form.email.trim()) e.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email address.";
    if (!form.phone.trim()) e.phone = "Phone number is required.";
    return e;
  };

  const set = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      const payload: any = {
        full_name: form.name.trim(),
        email:     form.email.trim().toLowerCase(),
        phone:     form.phone.trim(),
      };
      if (form.purchase_status) payload.purchase_status = form.purchase_status;

      await api.customers.create(payload);
      toast.success(`Customer "${form.name}" added successfully.`);
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to add customer. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-[15px] font-semibold text-neutral-900">Add Customer</h3>
            <p className="text-[12px] text-neutral-400 mt-0.5">Fill in the customer details below.</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-[12.5px] font-medium text-neutral-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. John Adebayo"
              className={`w-full px-3 py-2 border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors ${
                errors.name ? "border-red-400 bg-red-50" : "border-neutral-300 bg-white"
              }`}
            />
            {errors.name && (
              <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-[12.5px] font-medium text-neutral-700 mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="e.g. john@example.com"
              className={`w-full px-3 py-2 border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors ${
                errors.email ? "border-red-400 bg-red-50" : "border-neutral-300 bg-white"
              }`}
            />
            {errors.email && (
              <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.email}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[12.5px] font-medium text-neutral-700 mb-1.5">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="e.g. 08012345678"
              className={`w-full px-3 py-2 border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors ${
                errors.phone ? "border-red-400 bg-red-50" : "border-neutral-300 bg-white"
              }`}
            />
            {errors.phone && <p className="text-[11px] text-red-500 mt-1">{errors.phone}</p>}
          </div>

          {/* Purchase Status */}
          <div>
            <label className="block text-[12.5px] font-medium text-neutral-700 mb-1.5">
              Purchase Status <span className="text-neutral-400 text-[11px]">(optional)</span>
            </label>
            <select
              value={form.purchase_status}
              onChange={(e) => set("purchase_status", e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 bg-white rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors"
            >
              <option value="">— None —</option>
              {PURCHASE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-neutral-200 text-neutral-700 rounded-lg text-[13px] font-medium hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-[13px] font-medium hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
            ) : (
              <>Add Customer</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function Customers() {
  usePageTitle("Customers");
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [showAdd, setShowAdd]     = useState(false);

  const fetchCustomers = async () => {
    setLoading((prev) => prev || customers.length === 0);
    try {
      const data = await api.customers.list();
      setCustomers(data);
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setLoading(false);
    }
  };

  usePolling(fetchCustomers, 30_000);

  const fmt = (n: number | string) => `₦${Number(n).toLocaleString("en-NG")}`;

  const filtered = customers.filter((c) =>
    (c.full_name ?? c.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
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
          <Button
            onClick={() => setShowAdd(true)}
            className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-medium rounded-lg px-3 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Customer
          </Button>
        </div>
      </div>

      <motion.div variants={container} initial="hidden" animate="show"
        className="p-4 sm:p-6 lg:p-8 space-y-5 flex-1">

        {loading && customers.length === 0 ? (
          <>
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <Skeleton className="h-9 w-full sm:w-80 rounded-lg bg-neutral-100" />
              <Skeleton className="h-9 w-24 rounded-lg bg-neutral-100" />
            </div>
            <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="bg-neutral-50/70 border-b border-neutral-100 px-5 py-3 flex gap-4">
                {[140, 120, 80, 60, 100, 70].map((w, i) => (
                  <Skeleton key={i} className="h-3 rounded bg-neutral-200" style={{ width: w }} />
                ))}
              </div>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="px-5 py-3.5 flex items-center gap-4 border-b border-neutral-50 last:border-0">
                  <div className="flex items-center gap-3 flex-1">
                    <Skeleton className="h-8 w-8 rounded-full bg-neutral-100 shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-32 bg-neutral-100" />
                      <Skeleton className="h-3 w-24 bg-neutral-100" />
                    </div>
                  </div>
                  <Skeleton className="h-3.5 w-24 bg-neutral-100 hidden sm:block" />
                  <Skeleton className="h-3.5 w-16 bg-neutral-100 hidden md:block" />
                  <Skeleton className="h-5 w-16 rounded-full bg-neutral-100" />
                  <Skeleton className="h-3.5 w-20 bg-neutral-100 hidden lg:block" />
                  <Skeleton className="h-7 w-7 rounded-lg bg-neutral-100 ml-auto" />
                </div>
              ))}
            </div>
          </>
        ) : filtered.length === 0 ? (
          <motion.div variants={item}>
            <EmptyState
              icon={UsersIcon}
              title={search ? "No matching customers" : "No customers yet"}
              description={
                search
                  ? "Adjust your search to find what you're looking for."
                  : "Add your first customer to start tracking subscriptions and revenue."
              }
              action={
                <Button
                  onClick={() => (search ? setSearch("") : setShowAdd(true))}
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
              {/* Mobile add button */}
              <Button
                onClick={() => setShowAdd(true)}
                className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-medium rounded-lg px-3 shadow-sm sm:hidden ml-auto"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </Button>
            </motion.div>

            {/* Table */}
            <motion.div variants={item}
              className="bg-white rounded-xl border border-neutral-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50/70">
                      {["Customer", "Contact", "Subscriptions", "Status", "Purchase", "Total Revenue", "Rep", ""].map((col, i) => (
                        <th key={col || i}
                          className={[
                            "px-5 py-3 text-[10.5px] font-semibold tracking-wider text-neutral-400 uppercase",
                            col === "Contact"       ? "hidden sm:table-cell"  : "",
                            col === "Subscriptions" ? "hidden md:table-cell"  : "",
                            col === "Purchase"      ? "hidden md:table-cell"  : "",
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
                      const name = customer.full_name ?? customer.name ?? "Unknown";
                      const [bgCls, txtCls] = avatarColor(name);
                      const status = (customer.status || "active").toLowerCase();
                      const purchaseCfg = purchaseStatusConfig(customer.purchase_status);
                      return (
                        <tr key={customer.id}
                          className="hover:bg-neutral-50/60 transition-colors group">

                          {/* Customer */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-full ${bgCls} ${txtCls} flex items-center justify-center text-[11px] font-bold uppercase shrink-0`}>
                                {name.substring(0, 2)}
                              </div>
                              <div>
                                <div className="text-[13px] font-semibold text-neutral-900">{name}</div>
                                <div className="text-[11px] text-neutral-400 mt-0.5 sm:hidden">{customer.email}</div>
                                <div className="text-[11px] text-neutral-400 mt-0.5 hidden sm:block">
                                  Joined {customer.joinedAt || customer.created_at?.slice(0, 10) || "N/A"}
                                </div>
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
                                <div className="text-[12.5px] font-semibold text-neutral-900">
                                  {customer.subscriptions ?? customer.subscription_count ?? 0} total
                                </div>
                                <div className="text-[11px] text-neutral-400">
                                  {customer.activeSubscriptions ?? customer.active_subscription_count ?? 0} active
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Subscription Status */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <Badge variant={status === "active" ? "default" : "secondary"}
                              className={
                                status === "active"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100 text-[11px] gap-1.5"
                                  : status === "completed"
                                  ? "bg-blue-50 text-blue-700 border-blue-100 text-[11px] gap-1.5"
                                  : "text-[11px] gap-1.5"
                              }>
                              {status === "active" && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
                              {status === "completed" && <CheckCircle2 className="w-3 h-3" />}
                              <span className="capitalize">{status}</span>
                            </Badge>
                          </td>

                          {/* Purchase Status */}
                          <td className="px-5 py-3.5 whitespace-nowrap hidden md:table-cell">
                            {purchaseCfg ? (
                              <Badge className={`text-[11px] border ${purchaseCfg.cls}`}>
                                {purchaseCfg.label}
                              </Badge>
                            ) : (
                              <span className="text-[11px] text-neutral-300">—</span>
                            )}
                          </td>

                          {/* Revenue */}
                          <td className="px-5 py-3.5 whitespace-nowrap hidden lg:table-cell">
                            <div className="text-[13px] font-semibold text-neutral-900">
                              {fmt(customer.totalRevenue ?? customer.total_revenue ?? 0)}
                            </div>
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

      {/* Add Customer Modal */}
      {showAdd && (
        <AddCustomerModal
          onClose={() => setShowAdd(false)}
          onCreated={fetchCustomers}
        />
      )}
    </div>
  );
}
