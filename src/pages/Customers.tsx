import { Search, Filter, Plus, MoreVertical, FileText, CheckCircle2, Users as UsersIcon } from "lucide-react";
import { customers } from "../utils/mockData";
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
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function Customers() {
  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString("en-NG")}`;
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] w-full">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 sticky top-0 z-10 hidden md:block">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900">Customers</h1>
            <p className="text-sm text-neutral-500 mt-1">Customer and subscription management</p>
          </div>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 flex-1"
      >
        {customers.length === 0 ? (
          <motion.div variants={itemVariants}>
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
            {/* Search and Filter */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  className="w-full pl-9 bg-white"
                />
              </div>
              <Button variant="outline" className="gap-2 w-full sm:w-auto bg-white">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </motion.div>

            {/* Customers Table / Cards */}
            <motion.div variants={itemVariants} className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase">
                    <tr>
                      <th className="px-6 py-4 font-medium tracking-wider">Customer</th>
                      <th className="px-6 py-4 font-medium tracking-wider hidden sm:table-cell">Contact</th>
                      <th className="px-6 py-4 font-medium tracking-wider hidden md:table-cell">Subscriptions</th>
                      <th className="px-6 py-4 font-medium tracking-wider">Status</th>
                      <th className="px-6 py-4 font-medium tracking-wider hidden lg:table-cell">Total Revenue</th>
                      <th className="px-6 py-4 font-medium tracking-wider hidden xl:table-cell">Customer Rep</th>
                      <th className="px-6 py-4 font-medium tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-neutral-50/80 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold uppercase shrink-0">
                               {customer.name.substring(0, 2)}
                            </div>
                            <div>
                              <div className="font-semibold text-neutral-900">{customer.name}</div>
                              <div className="text-xs text-neutral-500 mt-0.5 sm:hidden">{customer.email}</div>
                              <div className="text-xs text-neutral-500 mt-0.5 hidden sm:block">Joined {customer.joinedAt}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                          <div className="text-sm text-neutral-700">{customer.email}</div>
                          <div className="text-xs text-neutral-500 mt-0.5">{customer.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-neutral-100 group-hover:bg-white transition-colors">
                               <FileText className="w-4 h-4 text-neutral-500" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-neutral-900">{customer.subscriptions} total</span>
                              <span className="text-xs text-neutral-500">
                                {customer.activeSubscriptions} active
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={customer.status === "active" ? "default" : "secondary"}
                            className={
                              customer.status === "active"
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 gap-1.5"
                                : customer.status === "completed"
                                ? "bg-blue-100 text-blue-700 hover:bg-blue-100 gap-1.5"
                                : "gap-1.5"
                            }
                          >
                            {customer.status === "active" && (
                              <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                            )}
                            {customer.status === "completed" && (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            <span className="capitalize">{customer.status}</span>
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                          <div className="font-semibold text-neutral-900">{formatCurrency(customer.totalRevenue)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden xl:table-cell">
                          <div className="text-sm text-neutral-600 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-neutral-200" />
                            {customer.customerRep}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-neutral-900">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
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
