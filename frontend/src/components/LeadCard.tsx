import React from "react";
import { Bell, AlertTriangle, Calendar, Phone, ArrowUpRight } from "lucide-react";
import { LeadSummary } from "../types";
import { StatusBadge } from "./StatusBadge";
import { format, parseISO } from "date-fns";

interface LeadCardProps {
  lead: LeadSummary;
  onClick: () => void;
  isPinnedToday?: boolean;
  isOverdue?: boolean;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onClick,
  isPinnedToday,
  isOverdue,
}) => {
  const formatFollowUp = (isoString?: string | null) => {
    if (!isoString) return null;
    try {
      const dt = parseISO(isoString);
      if (lead.follow_up_status === "today") {
        return `Follow-up today at ${format(dt, "h:mm a")}`;
      } else if (lead.follow_up_status === "overdue") {
        return `Overdue: was ${format(dt, "MMM d, h:mm a")}`;
      } else {
        return `Follow-up: ${format(dt, "MMM d, h:mm a")}`;
      }
    } catch {
      return null;
    }
  };

  const followUpLabel = formatFollowUp(lead.follow_up_date);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group relative bg-white rounded-xl p-5 border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md ${
        isPinnedToday
          ? "border-blue-200 bg-gradient-to-r from-blue-50/40 via-white to-white ring-1 ring-blue-500/10"
          : isOverdue
          ? "border-rose-200 bg-gradient-to-r from-rose-50/30 via-white to-white ring-1 ring-rose-500/10"
          : "border-slate-200/80 hover:border-slate-300"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Lead Main Info */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
              {lead.name}
            </h3>
            {lead.company && (
              <span className="text-xs font-normal text-slate-500">
                ({lead.company})
              </span>
            )}
            {lead.phone && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                <Phone className="w-3 h-3" />
                {lead.phone}
              </span>
            )}
          </div>

          {/* Last Note Snippet */}
          <div className="text-sm text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-700">Last Note: </span>
            <span className="italic">
              {lead.last_discussion_note
                ? lead.last_discussion_note.length > 120
                  ? `${lead.last_discussion_note.substring(0, 120)}...`
                  : lead.last_discussion_note
                : "No discussion notes recorded yet."}
            </span>
            {lead.time_ago && (
              <span className="ml-2 text-xs text-slate-400 font-normal not-italic">
                · {lead.time_ago}
              </span>
            )}
          </div>

          {/* Follow-up Reminder Badge */}
          {followUpLabel && (
            <div className="pt-1 flex items-center gap-2">
              {lead.follow_up_status === "today" && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                  <Bell className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                  <span>{followUpLabel}</span>
                </div>
              )}
              {lead.follow_up_status === "overdue" && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>{followUpLabel}</span>
                </div>
              )}
              {lead.follow_up_status === "upcoming" && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{followUpLabel}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top Right: Status Badge & Chevron indicator */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <StatusBadge status={lead.status} />
          <span className="text-[11px] text-slate-400 group-hover:text-blue-600 transition-colors inline-flex items-center gap-0.5">
            Timeline <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};
