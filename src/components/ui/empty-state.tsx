import * as React from "react";
import { cn } from "./utils";
import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon: Icon, title, description, action, ...props }, ref) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        ref={ref}
        className={cn(
          "flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 p-8 text-center animate-in fade-in-50",
          className
        )}
        {...props}
      >
        {Icon && (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 mb-4">
            <Icon className="h-6 w-6 text-neutral-500" />
          </div>
        )}
        <h3 className="mt-4 text-lg font-semibold text-neutral-900">{title}</h3>
        {description && (
          <p className="mt-2 text-sm text-neutral-500 max-w-sm text-center">
            {description}
          </p>
        )}
        {action && <div className="mt-6">{action}</div>}
      </motion.div>
    );
  }
);
EmptyState.displayName = "EmptyState";
