import { useState, useCallback } from "react";
import { MapPin, CheckCircle2, Clock, X, Upload, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { api } from "../services/api";
import { usePolling } from "../hooks/usePolling";
import { usePageTitle } from "../hooks/usePageTitle";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—";

const inputCls = "w-full h-9 px-3 rounded-lg border border-neutral-200 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#1a3d8f]/40 focus:border-[#2a52a8] bg-white";
const labelCls = "text-[12px] font-medium text-neutral-600 block mb-1.5";

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function AllocateModal({ sub, onClose, onDone }: {
  sub: any; onClose: () => void; onDone: () => void;
}) {
  const [plotNumber, setPlotNumber]   = useState("");
  const [allocDate, setAllocDate]     = useState(new Date().toISOString().slice(0, 10));
  const [letter, setLetter]           = useState<File | null>(null);
  const [notes, setNotes]             = useState("");
  const [saving, setSaving]           = useState(false);

  const handleSubmit = async () => {
    if (!plotNumber.trim()) { toast.error("Plot number is required."); return; }
    if (!allocDate) { toast.error("Allocation date is required."); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("plot_number", plotNumber);
      fd.append("allocation_date", allocDate);
      fd.append("allocation_notes", notes);
      if (letter) fd.append("allocation_letter", letter);
      await api.subscriptions.allocate(sub.id, fd);
      toast.success(`Plot ${plotNumber} allocated to ${sub.customer_name}.`);
      onDone();
    } catch (err: any) { toast.error(err.message ?? "Allocation failed."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-neutral-100"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <h2 className="text-[14px] font-semibold text-neutral-900">Allocate Plot</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-neutral-100">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        <div className="px-5 py-3 bg-[#0E2C72]/6/50 border-b border-[#0E2C72]/15">
          <p className="text-[12.5px] font-semibold text-neutral-800">{sub.customer_name}</p>
          <p className="text-[11.5px] text-neutral-500">{sub.property_name} · {sub.land_size} SQM</p>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Plot Number <span className="text-red-500">*</span></label>
            <input value={plotNumber} onChange={(e) => setPlotNumber(e.target.value)}
              className={inputCls} placeholder="e.g. A-12, Block C Lot 4, Plot 7" />
          </div>
          <div>
            <label className={labelCls}>Allocation Date <span className="text-red-500">*</span></label>
            <input type="date" value={allocDate} onChange={(e) => setAllocDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Allocation Letter <span className="text-[11px] text-neutral-400">(PDF — recommended)</span></label>
            <label className="block w-full border-2 border-dashed border-neutral-200 rounded-lg p-4 text-center cursor-pointer hover:border-[#2a52a8] transition-colors">
              <Upload className="size-5 mx-auto mb-1 text-neutral-400" />
              <span className="text-[12px] text-neutral-500">{letter ? letter.name : "Click to upload PDF"}</span>
              <input type="file" accept=".pdf" className="hidden" onChange={(e) => setLetter(e.target.files?.[0] ?? null)} />
            </label>
          </div>
          <div>
            <label className={labelCls}>Notes <span className="text-[11px] text-neutral-400">(optional)</span></label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#1a3d8f]/40 focus:border-[#2a52a8] resize-none bg-white"
              placeholder="Internal notes…" />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-neutral-100 flex gap-2.5">
          <Button onClick={handleSubmit} disabled={saving}
            className="flex-1 bg-[#0E2C72] hover:bg-[#0a2260] text-white gap-1.5">
            {saving ? <><Loader2 className="size-3.5 animate-spin" />Allocating…</> : "Confirm Allocation"}
          </Button>
          <Button variant="outline" onClick={onClose} className="px-4">Cancel</Button>
        </div>
      </motion.div>
    </div>
  );
}

export function AllocationPage() {
  usePageTitle("Allocation");
  const [subs, setSubs]             = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filterProp, setFilterProp] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL"|"AWAITING"|"ALLOCATED">("ALL");
  const [allocating, setAllocating] = useState<any | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.subscriptions.list({ status: "COMPLETED" });
      setSubs(data);
    } catch { toast.error("Failed to load allocations."); }
    finally { setLoading(false); }
  }, []);

  usePolling(load, 60_000);

  const awaiting  = subs.filter((s) => !s.plot_number);
  const allocated = subs.filter((s) => s.plot_number);
  const uniqueProps = Array.from(new Set(subs.map((s) => s.property_name).filter(Boolean))) as string[];

  const filtered = subs.filter((s) => {
    const matchProp   = !filterProp || s.property_name === filterProp;
    const matchStatus = filterStatus === "ALL" ||
      (filterStatus === "AWAITING" && !s.plot_number) ||
      (filterStatus === "ALLOCATED" && !!s.plot_number);
    return matchProp && matchStatus;
  });

  return (
    <div className="flex flex-col min-h-[calc(100vh-60px)]">
      <div className="bg-white border-b border-neutral-100 px-4 sm:px-6 lg:px-8 py-4 md:py-5">
        <h1 className="text-[17px] font-semibold text-neutral-900">Plot Allocation</h1>
        <p className="text-[12px] text-neutral-400 mt-0.5">Assign plot numbers to customers who have completed payments</p>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-5 flex-1">
        {loading ? (
          <div className="grid grid-cols-3 gap-4">{[1,2,3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative bg-white rounded-xl border border-neutral-100 p-4 shadow-sm overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500" />
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold mb-1">Awaiting Allocation</p>
                    <p className="text-2xl font-bold text-neutral-900">{awaiting.length}</p>
                    <p className="text-[11px] text-neutral-400 mt-1">Completed — no plot assigned</p>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600"><Clock className="size-4" /></div>
                </div>
              </div>
              <div className="relative bg-white rounded-xl border border-neutral-100 p-4 shadow-sm overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#1a3d8f]" />
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold mb-1">Allocated</p>
                    <p className="text-2xl font-bold text-neutral-900">{allocated.length}</p>
                    <p className="text-[11px] text-neutral-400 mt-1">Plot numbers assigned</p>
                  </div>
                  <div className="p-2 rounded-xl bg-[#0E2C72]/6 text-[#0E2C72]"><CheckCircle2 className="size-4" /></div>
                </div>
              </div>
              <div className="relative bg-white rounded-xl border border-neutral-100 p-4 shadow-sm overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500" />
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold mb-1">Total Completed</p>
                    <p className="text-2xl font-bold text-neutral-900">{subs.length}</p>
                    <p className="text-[11px] text-neutral-400 mt-1">All completed subscriptions</p>
                  </div>
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600"><MapPin className="size-4" /></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-neutral-50 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
                  {(["ALL","AWAITING","ALLOCATED"] as const).map((f) => (
                    <button key={f} onClick={() => setFilterStatus(f)}
                      className={`px-3 py-1 rounded-md text-[11.5px] font-semibold transition-all ${filterStatus === f ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}>
                      {f === "ALL" ? `All (${subs.length})` : f === "AWAITING" ? `Awaiting (${awaiting.length})` : `Allocated (${allocated.length})`}
                    </button>
                  ))}
                </div>
                {uniqueProps.length > 0 && (
                  <select value={filterProp} onChange={(e) => setFilterProp(e.target.value)}
                    className="h-9 px-2.5 border border-neutral-200 bg-white rounded-lg text-[12px] text-neutral-700 focus:outline-none focus:ring-1 focus:ring-[#1a3d8f]/30">
                    <option value="">All Properties</option>
                    {uniqueProps.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-50 bg-neutral-50/60">
                      {["Customer","Land Size","Property","Allocation Status","Plot Name","Letter","Action"].map((h) => (
                        <th key={h} className="px-4 py-3 text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wide whitespace-nowrap text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => (
                      <tr key={s.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2a52a8] to-[#0E2C72] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                              {initials(s.customer_name ?? "?")}
                            </div>
                            <div>
                              <p className="text-[12.5px] font-semibold text-neutral-800">{s.customer_name}</p>
                              <p className="text-[11px] text-neutral-400">{s.customer_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[12.5px] text-neutral-700 whitespace-nowrap">{s.land_size} SQM</td>
                        <td className="px-4 py-3 text-[12px] text-neutral-600 whitespace-nowrap">{s.property_name}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {s.plot_number ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#d6e0f5] text-[#0E2C72]">
                              <CheckCircle2 className="size-3" /> Allocated
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-700">
                              <Clock className="size-3" /> Awaiting Allocation
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[12.5px] text-neutral-700 whitespace-nowrap">
                          {s.plot_number || <span className="text-neutral-300">—</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {s.allocation_letter ? (
                            <a href={s.allocation_letter} target="_blank" rel="noopener noreferrer"
                              className="text-[12px] text-[#0E2C72] hover:text-[#0a2260] font-medium">
                              Download
                            </a>
                          ) : <span className="text-neutral-300 text-[12px]">—</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => setAllocating(s)}
                            disabled={!!s.plot_number}
                            className="px-3 py-1.5 rounded-lg bg-[#0E2C72] text-white text-[11.5px] font-semibold hover:bg-[#0a2260] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Allocate
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-[13px] text-neutral-400">
                          No subscriptions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {allocating && (
          <AllocateModal sub={allocating} onClose={() => setAllocating(null)} onDone={() => { setAllocating(null); load(); }} />
        )}
      </AnimatePresence>
    </div>
  );
}


