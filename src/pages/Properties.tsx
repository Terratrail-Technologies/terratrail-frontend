import { Link } from "react-router";
import { Plus, Search, Filter, MapPin, CheckCircle2, Clock, Building as BuildingIcon } from "lucide-react";
import { properties } from "../utils/mockData";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { motion } from "motion/react";
import { EmptyState } from "../components/ui/empty-state";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 26 } },
};

export function Properties() {
  const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;

  return (
    <div className="flex flex-col min-h-[calc(100vh-60px)] w-full">
      {/* Page header */}
      <div className="bg-white border-b border-neutral-100 px-6 lg:px-8 py-5 hidden md:block">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[18px] font-semibold text-neutral-900 tracking-tight">Properties</h1>
            <p className="text-[12.5px] text-neutral-400 mt-0.5">Property listing management</p>
          </div>
          <Button asChild
            className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-medium rounded-lg px-3 shadow-sm">
            <Link to="/properties/new">
              <Plus className="w-3.5 h-3.5" />
              Add Property
            </Link>
          </Button>
        </div>
      </div>

      <motion.div variants={container} initial="hidden" animate="show"
        className="p-4 sm:p-6 lg:p-8 space-y-5 flex-1">

        {properties.length > 0 ? (
          <>
            {/* Search + filter bar */}
            <motion.div variants={item} className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                <Input placeholder="Search properties…"
                  className="h-9 pl-9 text-[13px] bg-white border-neutral-200 focus-visible:ring-1 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-400 rounded-lg" />
              </div>
              <Button variant="outline" size="sm"
                className="h-9 gap-1.5 text-[12.5px] bg-white border-neutral-200 hover:bg-neutral-50 rounded-lg px-3">
                <Filter className="w-3.5 h-3.5" />
                Filter
              </Button>
            </motion.div>

            {/* Property grid */}
            <motion.div variants={item}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {properties.map((property) => (
                <Link key={property.id} to={`/properties/${property.id}/edit`}
                  className="bg-white rounded-xl border border-neutral-100 overflow-hidden
                             shadow-[0_1px_3px_rgba(0,0,0,0.06)]
                             hover:shadow-[0_6px_20px_rgba(0,0,0,0.09)]
                             hover:-translate-y-0.5 transition-all duration-200 group flex flex-col">

                  {/* Cover placeholder */}
                  <div className="h-40 bg-gradient-to-br from-neutral-50 to-emerald-50 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-emerald-600/0 group-hover:bg-emerald-600/[0.04] transition-colors" />
                    <div className="flex flex-col items-center gap-1.5 relative transition-transform group-hover:scale-105 duration-300">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-white/60">
                        <BuildingIcon className="w-7 h-7 text-emerald-500/60" />
                      </div>
                      <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">No cover image</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-3 gap-3">
                      <div className="min-w-0">
                        <h3 className="text-[14px] font-semibold text-neutral-900 group-hover:text-emerald-600 transition-colors truncate tracking-tight">
                          {property.name}
                        </h3>
                        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 inline-flex px-2 py-0.5 rounded-md mt-1.5">
                          {property.type}
                        </span>
                      </div>
                      <Badge variant={property.status === "published" ? "default" : "secondary"}
                        className={
                          property.status === "published"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100 shrink-0 text-[11px] gap-1"
                            : "shrink-0 text-[11px] gap-1"
                        }>
                        {property.status === "published"
                          ? <><CheckCircle2 className="w-3 h-3" />Published</>
                          : <><Clock className="w-3 h-3" />Draft</>}
                      </Badge>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-2 text-[12px] text-neutral-500 mb-5 bg-neutral-50 px-2.5 py-2 rounded-lg border border-neutral-100">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 text-neutral-400 shrink-0" />
                      <span className="truncate">
                        {property.location.address && `${property.location.address}, `}
                        <span className="font-medium">{property.location.city}, {property.location.state}</span>
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-neutral-50 mt-auto">
                      {[
                        { label: "SQM", value: property.totalSqm.toLocaleString() },
                        { label: "Subs", value: String(property.subscriptions) },
                        { label: "Revenue", value: fmt(property.revenue), highlight: true },
                      ].map((s) => (
                        <div key={s.label}>
                          <div className="text-[9.5px] font-semibold uppercase tracking-wider text-neutral-400 mb-0.5">{s.label}</div>
                          <div className={`text-[12.5px] font-bold ${s.highlight ? "text-emerald-600" : "text-neutral-800"}`}>
                            {s.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </motion.div>
          </>
        ) : (
          <motion.div variants={item}>
            <EmptyState
              icon={BuildingIcon}
              title="No properties yet"
              description="Get started by adding your first property to the platform."
              action={
                <Button asChild className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Link to="/properties/new">
                    <Plus className="w-4 h-4" />
                    Add Your First Property
                  </Link>
                </Button>
              }
            />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
