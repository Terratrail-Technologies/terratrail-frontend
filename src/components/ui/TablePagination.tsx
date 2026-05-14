import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "./utils";

interface Props {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
  onPageSize: (n: number) => void;
  className?: string;
}

const PAGE_SIZES = [10, 20, 50, 100];

export function TablePagination({ page, pageCount, total, pageSize, onPage, onPageSize, className }: Props) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  return (
    <div className={cn("flex items-center justify-between px-4 py-3 border-t border-neutral-100 flex-wrap gap-2", className)}>
      <div className="flex items-center gap-3">
        <span className="text-[12px] text-neutral-400">
          Showing {from}–{to} of {total}
        </span>
        <select
          value={pageSize}
          onChange={(e) => { onPageSize(Number(e.target.value)); onPage(1); }}
          className="h-7 px-2 text-[12px] border border-neutral-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#2a52a8]"
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>{s} / page</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <button
          disabled={page === 1}
          onClick={() => onPage(1)}
          className="w-7 h-7 rounded-lg border border-neutral-200 flex items-center justify-center disabled:opacity-40 hover:bg-neutral-50 text-[11px] font-medium"
        >
          «
        </button>
        <button
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
          className="w-7 h-7 rounded-lg border border-neutral-200 flex items-center justify-center disabled:opacity-40 hover:bg-neutral-50"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
          let p: number;
          if (pageCount <= 5) p = i + 1;
          else if (page <= 3) p = i + 1;
          else if (page >= pageCount - 2) p = pageCount - 4 + i;
          else p = page - 2 + i;
          return (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={cn(
                "w-7 h-7 rounded-lg border text-[12px] font-medium flex items-center justify-center",
                p === page
                  ? "bg-[#0E2C72] text-white border-[#0E2C72]"
                  : "border-neutral-200 hover:bg-neutral-50 text-neutral-700"
              )}
            >
              {p}
            </button>
          );
        })}
        <button
          disabled={page === pageCount || pageCount === 0}
          onClick={() => onPage(page + 1)}
          className="w-7 h-7 rounded-lg border border-neutral-200 flex items-center justify-center disabled:opacity-40 hover:bg-neutral-50"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          disabled={page === pageCount || pageCount === 0}
          onClick={() => onPage(pageCount)}
          className="w-7 h-7 rounded-lg border border-neutral-200 flex items-center justify-center disabled:opacity-40 hover:bg-neutral-50 text-[11px] font-medium"
        >
          »
        </button>
      </div>
    </div>
  );
}
