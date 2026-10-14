import React, { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, CheckCircle, ShieldCheck, TrendingUp, Lightbulb } from "lucide-react";
import { AIAnalysis } from "../types";

interface AIAdvisorDossierProps {
  analysis: AIAnalysis | null;
  onApplyFollowUp?: (isoDate: string) => void;
  onApplyStatus?: (status: string) => void;
}

export const AIAdvisorDossier: React.FC<AIAdvisorDossierProps> = ({
  analysis,
  onApplyFollowUp,
  onApplyStatus,
}) => {
  const [showTrace, setShowTrace] = useState(false);

  if (!analysis) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50/70 via-blue-50/40 to-white rounded-xl border border-indigo-200/80 p-4 shadow-xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-indigo-600 text-white shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
              AI Advisor Intelligence
            </span>
            <span className="text-[11px] text-indigo-600 ml-2 font-medium">
              (Chain-of-Thought Intent Analysis)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {analysis.sentiment && (
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                analysis.sentiment.includes("Positive")
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : analysis.sentiment.includes("Hesitant")
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {analysis.sentiment}
            </span>
          )}
        </div>
      </div>

      {/* Primary Extracted Insights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-100 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
            <span>Primary Intent</span>
          </div>
          <div className="font-semibold text-slate-800">
            {analysis.detected_intent}
          </div>
        </div>

        <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-100 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Next Best Action</span>
          </div>
          <div className="font-medium text-slate-800 leading-snug">
            {analysis.next_best_action}
          </div>
        </div>
      </div>

      {/* Suggested Follow-up & Status Actions */}
      {(analysis.suggested_follow_up_display || analysis.recommended_status) && (
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-indigo-100/60 text-xs">
          {analysis.suggested_follow_up_display && analysis.suggested_follow_up_date && (
            <div className="inline-flex items-center gap-2 bg-blue-100/80 px-2.5 py-1 rounded-md text-blue-900 border border-blue-200">
              <span className="font-semibold">Auto-detected follow-up:</span>
              <span>{analysis.suggested_follow_up_display}</span>
              {onApplyFollowUp && (
                <button
                  type="button"
                  onClick={() => onApplyFollowUp(analysis.suggested_follow_up_date!)}
                  className="font-bold underline text-blue-700 hover:text-blue-900 ml-1"
                >
                  Apply
                </button>
              )}
            </div>
          )}

          {analysis.recommended_status && onApplyStatus && (
            <div className="inline-flex items-center gap-1.5 bg-purple-50 px-2.5 py-1 rounded-md text-purple-900 border border-purple-200">
              <span className="font-medium">Recommended Stage:</span>
              <span className="font-bold">{analysis.recommended_status}</span>
              <button
                type="button"
                onClick={() => onApplyStatus(analysis.recommended_status!)}
                className="font-bold underline text-purple-700 hover:text-purple-900 ml-1"
              >
                Set
              </button>
            </div>
          )}
        </div>
      )}

      {/* Topics Tags */}
      {analysis.financial_topics && analysis.financial_topics.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {analysis.financial_topics.map((t, idx) => (
            <span
              key={idx}
              className="text-[10px] font-medium bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-600"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Collapsible Reasoning Trace (Fiduciary transparency) */}
      {analysis.reasoning_trace && analysis.reasoning_trace.length > 0 && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowTrace(!showTrace)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 hover:text-indigo-900 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {showTrace ? "Hide AI Reasoning Trace" : "View Fiduciary Reasoning Trace"}
            </span>
            {showTrace ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showTrace && (
            <div className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-lg text-[11px] font-mono space-y-1.5 shadow-inner">
              <div className="text-slate-400 font-sans font-bold text-[10px] uppercase tracking-wider mb-1">
                Fiduciary Step-by-Step Reasoning
              </div>
              {analysis.reasoning_trace.map((step, sIdx) => (
                <div key={sIdx} className="leading-relaxed">
                  {step}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
