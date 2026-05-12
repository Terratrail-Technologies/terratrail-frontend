/**
 * DateRangeFilter
 * Preset pills + Custom date-range picker.
 * Fully self-contained; zero external state required beyond the callbacks.
 */

import { useState } from "react";
import { ChevronDown, Calendar, X } from "lucide-react";
import { cn } from "./utils";
import {
  type DatePreset,
  type DateRange,
  PRESET_LABELS,
  presetToRange,
} from "../../hooks/useDashboard";

interface Props {
  preset:         DatePreset;
  customRange:    DateRange | null;
  onPresetChange: (preset: DatePreset, range: DateRange | null) => void;
}

const PRESETS: DatePreset[] = [
  "today", "7d", "30d", "this_month", "last_month", "this_year", "all_time", "custom",
];

export function DateRangeFilter({ preset, customRange, onPresetChange }: Props) {
  const [showCustom, setShowCustom] = useState(false);
  const [from, setFrom] = useState(customRange?.from ?? "");
  const [to,   setTo]   = useState(customRange?.to   ?? "");

  const handlePreset = (p: DatePreset) => {
    if (p === "custom") {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    onPresetChange(p, presetToRange(p));
  };

  const applyCustom = () => {
    if (!from || !to) return;
    setShowCustom(false);
    onPresetChange("custom", { from, to });
  };

  const clearCustom = () => {
    setFrom("");
    setTo("");
    setShowCustom(false);
    onPresetChange("all_time", null);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* ── Preset pills ── */}
      <div className="flex flex-wrap gap-1.5 items-center">
        {PRESETS.map((p) => {
          const isActive = preset === p && !(p === "custom" && showCustom);
          return (
            <button
              key={p}
              type="button"
              onClick={() => handlePreset(p)}
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-medium transition-all duration-150 border",
                p === "custom"
                  ? isActive
                    ? "bg-[#0E2C72] text-white border-[#0E2C72] shadow-sm"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-[#0E2C72]/40 hover:text-[#0a2260]"
                  : isActive
                  ? "bg-[#0E2C72] text-white border-[#0E2C72] shadow-sm"
                  : "bg-white text-neutral-500 border-neutral-200 hover:bg-neutral-50 hover:text-neutral-800"
              )}
            >
              {p === "custom" && <Calendar className="w-3 h-3" />}
              {PRESET_LABELS[p]}
              {p === "custom" && <ChevronDown className="w-3 h-3" />}
            </button>
          );
        })}

        {/* Active custom range label */}
        {preset === "custom" && customRange && !showCustom && (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
            {customRange.from} → {customRange.to}
            <button type="button" onClick={clearCustom} className="hover:text-red-500 transition-colors">
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        )}
      </div>

      {/* ── Custom date picker popover ── */}
      {showCustom && (
        <div className="flex flex-wrap items-end gap-2 bg-white border border-neutral-200 rounded-xl px-4 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.08)] w-fit">
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider">From</label>
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
              className="h-8 px-2.5 rounded-lg border border-neutral-200 text-[12.5px] text-neutral-800 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]/20 focus:border-[#2a52a8] transition-all"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider">To</label>
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
              className="h-8 px-2.5 rounded-lg border border-neutral-200 text-[12.5px] text-neutral-800 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]/20 focus:border-[#2a52a8] transition-all"
            />
          </div>
          <div className="flex gap-1.5 pb-px">
            <button
              type="button"
              onClick={applyCustom}
              disabled={!from || !to}
              className="h-8 px-3 bg-[#0E2C72] hover:bg-[#0a2260] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[12px] font-medium rounded-lg transition-colors"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => setShowCustom(false)}
              className="h-8 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-[12px] font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


