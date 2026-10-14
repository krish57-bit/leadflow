import React, { useRef, useEffect } from "react";
import { Search, X, Calendar, AlertCircle } from "lucide-react";
import { LeadStatus } from "../types";

interface FilterBarProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  followUpFilter: string;
  onFollowUpFilterChange: (filter: string) => void;
  statusCounts: Record<string, number>;
  totalCount: number;
  todayCount: number;
  overdueCount: number;
}

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: "All", value: "All" },
  { label: "New", value: "New" },
  { label: "Contacted", value: "Contacted" },
  { label: "Qualified", value: "Qualified" },
  { label: "Proposal Sent", value: "Proposal Sent" },
  { label: "Won", value: "Won" },
  { label: "Lost", value: "Lost" },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  currentStatus,
  onStatusChange,
  searchQuery,
  onSearchChange,
  followUpFilter,
  onFollowUpFilterChange,
  statusCounts,
  totalCount,
  todayCount,
  overdueCount,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cmd+K / Ctrl+K shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="space-y-4">
      {/* Top Search & Quick Follow-up Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search leads, companies, or notes... (⌘K)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Follow-up Quick Chips */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => onFollowUpFilterChange("all")}
            className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              followUpFilter === "all"
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            All Leads
          </button>
          <button
            type="button"
            onClick={() =>
              onFollowUpFilterChange(followUpFilter === "today" ? "all" : "today")
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              followUpFilter === "today"
                ? "bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-500/20"
                : "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Today</span>
            {todayCount > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  followUpFilter === "today"
                    ? "bg-white/25 text-white"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {todayCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() =>
              onFollowUpFilterChange(
                followUpFilter === "overdue" ? "all" : "overdue"
              )
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              followUpFilter === "overdue"
                ? "bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-500/20"
                : "bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Overdue</span>
            {overdueCount > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  followUpFilter === "overdue"
                    ? "bg-white/25 text-white"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {overdueCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Status Pill Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-sm no-scrollbar">
        <span className="text-xs font-bold tracking-wider text-slate-400 uppercase mr-1">
          FILTERS:
        </span>
        {STATUS_OPTIONS.map((opt) => {
          const isSelected = currentStatus === opt.value;
          const count =
            opt.value === "All"
              ? totalCount
              : statusCounts[opt.value] || 0;

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onStatusChange(opt.value)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer select-none ${
                isSelected
                  ? "bg-blue-600 text-white shadow-xs ring-2 ring-blue-500/20"
                  : "bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <span>{opt.label}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                  isSelected
                    ? "bg-white/25 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
