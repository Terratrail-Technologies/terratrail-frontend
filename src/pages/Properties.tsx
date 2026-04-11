import { Link } from "react-router";
import { Plus, Search, Filter, MapPin, CheckCircle2, Clock, Building as BuildingIcon } from "lucide-react";
import { properties } from "../utils/mockData";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { motion } from "motion/react";
import { EmptyState } from "../components/ui/empty-state";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function Properties() {
  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString("en-NG")}`;
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] w-full">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 sticky top-0 z-10 hidden md:block">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900">Properties</h1>
            <p className="text-sm text-neutral-500 mt-1">Property listing management</p>
          </div>
          <Button asChild className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto">
            <Link to="/properties/new">
              <Plus className="w-4 h-4" />
              Add Property
            </Link>
          </Button>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 flex-1"
      >
        {properties.length > 0 ? (
          <>
            {/* Search and Filter */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  type="text"
                  placeholder="Search properties..."
                  className="w-full pl-9 bg-white"
                />
              </div>
              <Button variant="outline" className="gap-2 w-full sm:w-auto bg-white">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </motion.div>

            {/* Properties Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {properties.map((property) => (
                <Link
                  key={property.id}
                  to={`/properties/${property.id}/edit`}
                  className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-lg transition-all group flex flex-col"
                >
                  {/* Cover Image Placeholder */}
                  <div className="h-48 bg-gradient-to-br from-neutral-100 to-emerald-50 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-emerald-600/0 group-hover:bg-emerald-600/5 transition-colors z-10" />
                    <div className="text-center relative z-20 transition-transform group-hover:scale-105 duration-300">
                      <div className="w-16 h-16 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm border border-white/40">
                        <BuildingIcon className="w-8 h-8 text-emerald-600/70" />
                      </div>
                      <div className="text-xs font-medium text-emerald-800/60 uppercase tracking-wider">No cover image</div>
                    </div>
                  </div>

                  {/* Property Info */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-4 gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-neutral-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                          {property.name}
                        </h3>
                        <div className="text-sm font-medium text-emerald-600 bg-emerald-50 inline-flex px-2 py-0.5 rounded-md mt-2">
                           {property.type}
                        </div>
                      </div>
                      <Badge
                        variant={property.status === "published" ? "default" : "secondary"}
                        className={
                          property.status === "published"
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none shrink-0"
                            : "shrink-0"
                        }
                      >
                        {property.status === "published" ? (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Published
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Draft
                          </div>
                        )}
                      </Badge>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-2.5 text-sm text-neutral-600 mb-6 bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-100">
                      <MapPin className="w-4 h-4 mt-0.5 text-neutral-400 shrink-0" />
                      <div className="flex flex-col">
                        {property.location.address && <span className="text-neutral-700">{property.location.address}</span>}
                        <span className="text-neutral-500 font-medium">
                          {property.location.city}, {property.location.state}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-100 mt-auto">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">Total SQM</div>
                        <div className="text-sm font-bold text-neutral-900">
                          {property.totalSqm.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">Subscriptions</div>
                        <div className="text-sm font-bold text-neutral-900">{property.subscriptions}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">Revenue</div>
                        <div className="text-sm font-bold text-emerald-600">{formatCurrency(property.revenue)}</div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </motion.div>
          </>
        ) : (
          <motion.div variants={itemVariants}>
            <EmptyState
              icon={BuildingIcon}
              title="No properties yet"
              description="Get started by adding your first property to the platform. Manage listings, subscriptions, and revenue in one place."
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
