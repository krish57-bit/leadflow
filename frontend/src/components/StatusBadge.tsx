import React from "react";
import { LeadStatus } from "../types";

interface StatusBadgeProps {
  status: LeadStatus | string;
  size?: "sm" | "md";
}

const statusConfig: Record<
  string,
  { bg: string; text: string; border: string; label: string }
> = {
  New: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    label: "NEW",
  },
  Contacted: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    label: "CONTACTED",
  },
  Qualified: {
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    label: "QUALIFIED",
  },
  "Proposal Sent": {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    label: "PROPOSAL SENT",
  },
  Won: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-300",
    label: "WON",
  },
  Lost: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    label: "LOST",
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "md",
}) => {
  const config = statusConfig[status] || {
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-200",
    label: status.toUpperCase(),
  };

  const sizeClasses =
    size === "sm"
      ? "text-[10px] px-2 py-0.5 tracking-wider"
      : "text-xs px-2.5 py-1 tracking-wider";

  return (
    <span
      className={`inline-flex items-center justify-center font-semibold rounded-md border uppercase transition-colors ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      {config.label}
    </span>
  );
};
