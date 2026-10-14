import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Phone,
  Calendar,
  Clock,
  Sparkles,
  Send,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  MessageSquare,
  Video,
  FileText,
  PhoneCall,
  CheckCircle2,
  ChevronRight,
  Flame,
} from "lucide-react";
import { LeadDetail, LeadStatus, Discussion, AIAnalysis } from "../types";
import { addDiscussion, updateLeadStatus, analyzeNoteAI } from "../lib/api";
import { format, parseISO, addDays, addHours, nextTuesday } from "date-fns";
import { AIAdvisorDossier } from "./AIAdvisorDossier";

interface LeadTimelineModalProps {
  leadId: number;
  initialLead: LeadDetail;
  onClose: () => void;
  onLeadUpdated: () => void;
}

const PIPELINE_STAGES: LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Won",
];

const ACTIVITY_TYPES = [
  { id: "note", label: "Note", icon: FileText, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { id: "call", label: "Phone Call", icon: PhoneCall, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { id: "meeting", label: "Discovery Meeting", icon: Video, color: "text-purple-600 bg-purple-50 border-purple-200" },
  { id: "proposal", label: "Pricing / Proposal", icon: FileText, color: "text-amber-600 bg-amber-50 border-amber-200" },
];

export const LeadTimelineModal: React.FC<LeadTimelineModalProps> = ({
  leadId,
  initialLead,
  onClose,
  onLeadUpdated,
}) => {
  const [lead, setLead] = useState<LeadDetail>(initialLead);
  const [status, setStatus] = useState<LeadStatus>(initialLead.status);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // New Discussion Form State
  const [noteText, setNoteText] = useState("");
  const [activityType, setActivityType] = useState<string>("note");
  const [setFollowUp, setSetFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("14:00");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // AI Reasoning State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAIAnalysis, setCurrentAIAnalysis] = useState<AIAnalysis | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Timeline Filter State
  const [timelineFilter, setTimelineFilter] = useState<string>("all");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Handle outside click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  // Status Change Handler
  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (newStatus === status) {
      setStatusDropdownOpen(false);
      return;
    }
    setIsUpdatingStatus(true);
    setStatusDropdownOpen(false);
    try {
      await updateLeadStatus(leadId, newStatus);
      setStatus(newStatus);
      setLead((prev) => ({ ...prev, status: newStatus }));
      onLeadUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // AI Analysis Handler
  const handleRunAIReasoning = async () => {
    if (!noteText.trim()) {
      setErrorMsg("Please enter discussion notes or talking points before analyzing with AI.");
      return;
    }
    setErrorMsg(null);
    setIsAnalyzing(true);
    try {
      const res = await analyzeNoteAI({
        note: noteText,
        lead_name: lead.name,
        company: lead.company || undefined,
        current_status: lead.status,
      });
      setCurrentAIAnalysis(res);

      // Auto-populate follow-up date and time if detected
      if (res.suggested_follow_up_date) {
        const dt = parseISO(res.suggested_follow_up_date);
        setSetFollowUp(true);
        setFollowUpDate(format(dt, "yyyy-MM-dd"));
        setFollowUpTime(format(dt, "HH:mm"));
      }
    } catch (err: any) {
      setErrorMsg(err.message || "AI Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Quick Preset Handlers
  const applyPreset = (daysOffset: number, hour: number, minute: number = 0) => {
    const target = addDays(new Date(), daysOffset);
    setSetFollowUp(true);
    setFollowUpDate(format(target, "yyyy-MM-dd"));
    setFollowUpTime(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
  };

  // Save Discussion Note
  const handleSaveNote = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!noteText.trim()) {
      setErrorMsg("Discussion note cannot be empty.");
      return;
    }
    setErrorMsg(null);
    setIsSaving(true);

    try {
      let finalFollowUpISO: string | null = null;
      if (setFollowUp && followUpDate) {
        const timePart = followUpTime || "14:00";
        finalFollowUpISO = new Date(`${followUpDate}T${timePart}:00`).toISOString();
      }

      const createdDisc = await addDiscussion(leadId, {
        note: noteText.trim(),
        activity_type: activityType,
        follow_up_date: finalFollowUpISO,
        ai_analysis: currentAIAnalysis ? JSON.stringify(currentAIAnalysis) : undefined,
      });

      // Update local timeline state immediately (newest at top)
      setLead((prev) => ({
        ...prev,
        follow_up_date: finalFollowUpISO !== null ? finalFollowUpISO : prev.follow_up_date,
        discussions: [createdDisc, ...prev.discussions],
      }));

      // Reset form
      setNoteText("");
      setActivityType("note");
      setSetFollowUp(false);
      setFollowUpDate("");
      setCurrentAIAnalysis(null);

      // Notify parent list to update immediately
      onLeadUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save note");
    } finally {
      setIsSaving(false);
    }
  };

  // Copy phone helper
  const handleCopyPhone = () => {
    if (lead.phone) {
      navigator.clipboard.writeText(lead.phone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  // Filtered discussions
  const filteredDiscussions = lead.discussions.filter((d) => {
    if (timelineFilter === "all") return true;
    return (d.activity_type || "note") === timelineFilter;
  });

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/70 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {lead.name}
                </h2>
                {lead.company && (
                  <span className="text-sm font-medium text-slate-500">
                    ({lead.company})
                  </span>
                )}
              </div>

              {/* Contact details & Zia Best Time */}
              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                {lead.phone ? (
                  <div className="inline-flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <a
                      href={`tel:${lead.phone}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {lead.phone}
                    </a>
                    <button
                      onClick={handleCopyPhone}
                      title="Copy phone"
                      className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                    >
                      {copiedPhone ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                ) : (
                  <span className="text-slate-400">No phone provided</span>
                )}

                {lead.best_time_to_contact && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    <span>Zia Best Time: {lead.best_time_to_contact}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Header: Interactive Status Dropdown & Close */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  disabled={isUpdatingStatus}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs"
                >
                  <span>{status}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Status Dropdown Menu */}
                {statusDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-20 text-xs font-medium">
                    {["New", "Contacted", "Qualified", "Proposal Sent", "Won", "Lost"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleStatusChange(opt as LeadStatus)}
                        className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 flex items-center justify-between text-slate-700 transition-colors"
                      >
                        <span>{opt}</span>
                        {opt === status && (
                          <Check className="w-3.5 h-3.5 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Zoho-Style Interactive Pipeline Stage Progression Bar */}
          <div className="pt-2 border-t border-slate-200/60">
            <div className="flex items-center gap-1 text-[11px] overflow-x-auto pb-1 no-scrollbar">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                STAGE:
              </span>
              {PIPELINE_STAGES.map((stageName, idx) => {
                const isCurrent = status === stageName;
                const isPassed =
                  PIPELINE_STAGES.indexOf(status) > idx && status !== "Lost";

                return (
                  <button
                    key={stageName}
                    type="button"
                    onClick={() => handleStatusChange(stageName)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all shrink-0 ${
                      isCurrent
                        ? "bg-blue-600 text-white shadow-xs"
                        : isPassed
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {isPassed && <Check className="w-3 h-3 text-emerald-600" />}
                    <span>{stageName}</span>
                    {idx < PIPELINE_STAGES.length - 1 && (
                      <ChevronRight className="w-3 h-3 text-slate-300 ml-0.5" />
                    )}
                  </button>
                );
              })}
              {status === "Lost" && (
                <span className="px-2 py-0.5 rounded-md font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  Lost
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Timeline Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center justify-between">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg(null)} className="font-bold">
                ×
              </button>
            </div>
          )}

          {/* AI Advisor Dossier Card if generated */}
          {currentAIAnalysis && (
            <AIAdvisorDossier
              analysis={currentAIAnalysis}
              onApplyStatus={(s) => handleStatusChange(s as LeadStatus)}
            />
          )}

          {/* Activity Filter Bar (Zoho CRM timeline filtering) */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
              Discussion History ({lead.discussions.length})
            </span>
            <div className="flex items-center gap-1">
              {["all", "call", "meeting", "note", "proposal"].map((filterKey) => (
                <button
                  key={filterKey}
                  type="button"
                  onClick={() => setTimelineFilter(filterKey)}
                  className={`px-2 py-0.5 rounded text-[11px] capitalize transition-colors ${
                    timelineFilter === filterKey
                      ? "bg-slate-900 text-white font-semibold"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {filterKey}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Feed */}
          <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {filteredDiscussions.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm italic">
                {lead.discussions.length === 0
                  ? "No discussion notes recorded yet. Add your first note below."
                  : "No activities matching this filter."}
              </div>
            ) : (
              filteredDiscussions.map((disc, idx) => {
                const isLatest = idx === 0;
                let formattedDate = "";
                try {
                  formattedDate = format(parseISO(disc.created_at), "MMM d, h:mm a");
                } catch {
                  formattedDate = disc.created_at;
                }

                let followUpSetFormatted: string | null = null;
                if (disc.follow_up_date) {
                  try {
                    followUpSetFormatted = format(
                      parseISO(disc.follow_up_date),
                      "MMM d, h:mm a"
                    );
                  } catch {
                    followUpSetFormatted = disc.follow_up_date;
                  }
                }

                const actConfig =
                  ACTIVITY_TYPES.find((a) => a.id === disc.activity_type) ||
                  ACTIVITY_TYPES[0];
                const ActIcon = actConfig.icon;

                return (
                  <div key={disc.id} className="relative group">
                    {/* Timeline Node Dot */}
                    <div
                      className={`absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white transition-transform ${
                        isLatest
                          ? "bg-blue-600 ring-2 ring-blue-100"
                          : "bg-slate-300"
                      }`}
                    />

                    {/* Timeline Card */}
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 space-y-2 hover:border-slate-300 transition-colors">
                      {/* Date & Activity Type Header */}
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${actConfig.color}`}
                          >
                            <ActIcon className="w-3 h-3" />
                            <span>{actConfig.label}</span>
                          </span>
                          <span className="font-semibold text-slate-700">
                            {formattedDate}
                          </span>
                        </div>
                        {disc.time_ago && (
                          <span className="text-slate-400">
                            ({disc.time_ago})
                          </span>
                        )}
                      </div>

                      {/* Note Content */}
                      <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {disc.note}
                      </p>

                      {/* Associated Follow-up Set */}
                      {followUpSetFormatted && (
                        <div className="pt-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-100/70 text-blue-800 border border-blue-200">
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            <span>Follow-up set for: {followUpSetFormatted}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Discussion Input Form Footer */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-200 space-y-3">
          {/* Zoho-style Activity Type Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Log Activity:
            </span>
            {ACTIVITY_TYPES.map((act) => {
              const IconComp = act.icon;
              const isSelected = activityType === act.id;
              return (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => setActivityType(act.id)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <IconComp className="w-3 h-3" />
                  <span>{act.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSaveNote} className="space-y-3">
            {/* Note Textarea */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                rows={3}
                placeholder="Log a new discussion... (e.g. 'Sent wealth proposal. Follow up next Tuesday at 2pm')"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    handleSaveNote();
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none shadow-xs"
              />
            </div>

            {/* Quick Follow-up Presets (Zoho Frictionless Action) */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Quick Presets:
              </span>
              <button
                type="button"
                onClick={() => applyPreset(1, 10, 0)}
                className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-medium transition-colors"
              >
                + Tomorrow 10 AM
              </button>
              <button
                type="button"
                onClick={() => applyPreset(2, 14, 0)}
                className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-medium transition-colors"
              >
                + In 2 Days 2 PM
              </button>
              <button
                type="button"
                onClick={() => applyPreset(7, 11, 0)}
                className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-medium transition-colors"
              >
                + Next Week
              </button>
            </div>

            {/* Controls row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              {/* Left: AI Assist & Set Follow-up Checkbox */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleRunAIReasoning}
                  disabled={isAnalyzing || !noteText.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{isAnalyzing ? "Reasoning..." : "✨ AI Reason & Extract"}</span>
                </button>

                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={setFollowUp}
                    onChange={(e) => setSetFollowUp(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span>Set Follow-up</span>
                </label>

                {setFollowUp && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      required={setFollowUp}
                      className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <input
                      type="time"
                      value={followUpTime}
                      onChange={(e) => setFollowUpTime(e.target.value)}
                      className="px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                )}
              </div>

              {/* Right: Save Button */}
              <button
                type="submit"
                disabled={isSaving || !noteText.trim()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <span>{isSaving ? "Saving..." : "Save Note"}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
