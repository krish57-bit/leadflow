"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp,
  Plus,
  RotateCcw,
  Calendar,
  AlertTriangle,
  Users,
  Search,
  Sparkles,
} from "lucide-react";
import { LeadSummary, LeadDetail, LeadStatus } from "../types";
import { fetchLeads, fetchLeadDetail, resetDatabaseSeed } from "../lib/api";
import { LeadCard } from "../components/LeadCard";
import { FilterBar } from "../components/FilterBar";
import { LeadTimelineModal } from "../components/LeadTimelineModal";
import { AddLeadModal } from "../components/AddLeadModal";

export default function LeadFlowPage() {
  const [allLeads, setAllLeads] = useState<LeadSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters State
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [followUpFilter, setFollowUpFilter] = useState("all");

  // Dialog State
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [selectedLeadDetail, setSelectedLeadDetail] = useState<LeadDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Fetch All Leads from Backend
  const loadLeads = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const data = await fetchLeads(); // Fetch all leads to maintain single source of truth
      setAllLeads(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load leads from server.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // Keyboard shortcut: Press 'N' (when not in an input) to open Add Lead modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        e.key.toLowerCase() === "n" &&
        !["INPUT", "TEXTAREA"].includes(target.tagName) &&
        !selectedLeadId &&
        !isAddModalOpen
      ) {
        e.preventDefault();
        setIsAddModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedLeadId, isAddModalOpen]);

  // Open Lead Timeline Modal
  const handleSelectLead = async (lead: LeadSummary) => {
    setSelectedLeadId(lead.id);
    setIsLoadingDetail(true);
    try {
      const detail = await fetchLeadDetail(lead.id);
      setSelectedLeadDetail(detail);
    } catch (err: any) {
      setErrorMsg("Failed to load discussion timeline.");
      setSelectedLeadId(null);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Re-seed Database
  const handleResetSeed = async () => {
    if (!confirm("Reset lead database to initial Pravar AI wireframe seed data?")) return;
    setIsSeeding(true);
    try {
      await resetDatabaseSeed();
      await loadLeads();
    } catch (err: any) {
      setErrorMsg("Failed to reset database.");
    } finally {
      setIsSeeding(false);
    }
  };

  // Global Pipeline Stats (STABLE: never change or collapse to 0 when user clicks filters)
  const { globalStatusCounts, globalTodayCount, globalOverdueCount, globalWonCount, totalPipeline } =
    useMemo(() => {
      const counts: Record<string, number> = {};
      let tCount = 0;
      let oCount = 0;

      allLeads.forEach((l) => {
        counts[l.status] = (counts[l.status] || 0) + 1;
        if (l.follow_up_status === "today") tCount++;
        if (l.follow_up_status === "overdue") oCount++;
      });

      return {
        globalStatusCounts: counts,
        globalTodayCount: tCount,
        globalOverdueCount: oCount,
        globalWonCount: counts["Won"] || 0,
        totalPipeline: allLeads.length,
      };
    }, [allLeads]);

  // Reactive Filtered Leads
  const filteredLeads = useMemo(() => {
    return allLeads.filter((lead) => {
      // 1. Status Filter
      if (statusFilter !== "All" && lead.status !== statusFilter) {
        return false;
      }

      // 2. Follow-up Filter
      if (followUpFilter !== "all" && lead.follow_up_status !== followUpFilter) {
        return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = lead.name.toLowerCase().includes(query);
        const matchesCompany = lead.company?.toLowerCase().includes(query) ?? false;
        const matchesPhone = lead.phone?.toLowerCase().includes(query) ?? false;
        const matchesNote = lead.last_discussion_note?.toLowerCase().includes(query) ?? false;
        if (!matchesName && !matchesCompany && !matchesPhone && !matchesNote) {
          return false;
        }
      }

      return true;
    });
  }, [allLeads, statusFilter, followUpFilter, searchQuery]);

  // Section Partitioning
  const isDefaultView = statusFilter === "All" && followUpFilter === "all" && !searchQuery.trim();

  const { todaySectionLeads, overdueSectionLeads, otherSectionLeads } = useMemo(() => {
    if (isDefaultView) {
      const today = allLeads.filter((l) => l.follow_up_status === "today");
      const overdue = allLeads.filter((l) => l.follow_up_status === "overdue");
      const others = allLeads.filter(
        (l) => l.follow_up_status !== "today" && l.follow_up_status !== "overdue"
      );
      return {
        todaySectionLeads: today,
        overdueSectionLeads: overdue,
        otherSectionLeads: others,
      };
    } else {
      return {
        todaySectionLeads: [],
        overdueSectionLeads: [],
        otherSectionLeads: filteredLeads,
      };
    }
  }, [isDefaultView, allLeads, filteredLeads]);

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm flex items-center justify-center">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
                  LeadFlow
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Pravar AI Wealth CRM
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Advisor client engagement & intelligent follow-up copilot
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleResetSeed}
              disabled={isSeeding}
              title="Reset database to seed data"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-colors shadow-2xs"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isSeeding ? "animate-spin" : ""}`} />
              <span className="hidden md:inline">Reset Seed</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 transition-all shadow-sm hover:shadow"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Add New Lead</span>
              <kbd className="hidden lg:inline-block ml-1 px-1.5 py-0.2 rounded bg-blue-700/60 text-[10px] font-mono text-blue-100">
                N
              </kbd>
            </button>
          </div>
        </div>
      </header>

      {/* Main Single-Screen Content Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Error Alert if any */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800 flex items-center justify-between">
            <span>{errorMsg}</span>
            <button
              onClick={() => setErrorMsg(null)}
              className="font-bold underline text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Zoho-Inspired KPI & Activity Signal Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Pipeline</span>
              <Users className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-xl font-extrabold text-slate-900">{totalPipeline}</div>
            <div className="text-[10px] text-slate-400">Active advisory prospects</div>
          </div>

          <div className="bg-white rounded-xl p-3.5 border border-blue-200/80 shadow-2xs space-y-1 bg-gradient-to-br from-blue-50/30 to-white">
            <div className="flex items-center justify-between text-blue-700">
              <span className="text-[11px] font-bold uppercase tracking-wider">Due Today</span>
              <Calendar className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            </div>
            <div className="text-xl font-extrabold text-blue-900">{globalTodayCount}</div>
            <div className="text-[10px] text-blue-600 font-medium">Pinned for immediate action</div>
          </div>

          <div className="bg-white rounded-xl p-3.5 border border-rose-200/80 shadow-2xs space-y-1 bg-gradient-to-br from-rose-50/30 to-white">
            <div className="flex items-center justify-between text-rose-700">
              <span className="text-[11px] font-bold uppercase tracking-wider">Overdue</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="text-xl font-extrabold text-rose-900">{globalOverdueCount}</div>
            <div className="text-[10px] text-rose-600 font-medium">
              {globalOverdueCount > 0 ? "Requires attention" : "All caught up"}
            </div>
          </div>

          <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-[11px] font-bold uppercase tracking-wider">Mandates Won</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-xl font-extrabold text-slate-900">{globalWonCount}</div>
            <div className="text-[10px] text-emerald-600 font-medium">
              {totalPipeline > 0 ? Math.round((globalWonCount / totalPipeline) * 100) : 0}% win rate
            </div>
          </div>
        </div>

        {/* Filter & Live Search Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <FilterBar
            currentStatus={statusFilter}
            onStatusChange={setStatusFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            followUpFilter={followUpFilter}
            onFollowUpFilterChange={setFollowUpFilter}
            totalCount={totalPipeline}
            statusCounts={globalStatusCounts}
            todayCount={globalTodayCount}
            overdueCount={globalOverdueCount}
          />
        </div>

        {/* Loading Skeletons */}
        {isLoading && allLeads.length === 0 ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-28 bg-slate-200/70 rounded-xl" />
            <div className="h-24 bg-slate-200/60 rounded-xl" />
            <div className="h-24 bg-slate-200/60 rounded-xl" />
          </div>
        ) : filteredLeads.length === 0 ? (
          /* Empty Search / Filter State */
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No leads found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              No matching leads found for your active filters or search criteria.
            </p>
            <button
              onClick={() => {
                setStatusFilter("All");
                setSearchQuery("");
                setFollowUpFilter("all");
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1. PINNED TODAY'S FOLLOW-UPS SECTION (Default Cockpit View) */}
            {todaySectionLeads.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  <span className="text-base">🚀</span>
                  <span>TODAY&apos;S FOLLOW-UPS</span>
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                    {todaySectionLeads.length} Pinned
                  </span>
                </div>

                <div className="space-y-3">
                  {todaySectionLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      isPinnedToday
                      onClick={() => handleSelectLead(lead)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 2. OVERDUE FOLLOW-UPS SECTION (Default Cockpit View) */}
            {overdueSectionLeads.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-rose-600">
                  <span className="text-base">⚠️</span>
                  <span>OVERDUE FOLLOW-UPS</span>
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                    {overdueSectionLeads.length} Requires Attention
                  </span>
                </div>

                <div className="space-y-3">
                  {overdueSectionLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      isOverdue
                      onClick={() => handleSelectLead(lead)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 3. MAIN LEADS LIST SECTION */}
            <section className="space-y-3">
              <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-500">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>
                    {isDefaultView
                      ? "ALL LEADS"
                      : statusFilter !== "All"
                      ? `${statusFilter.toUpperCase()} LEADS`
                      : followUpFilter === "today"
                      ? "TODAY'S FOLLOW-UPS"
                      : followUpFilter === "overdue"
                      ? "OVERDUE FOLLOW-UPS"
                      : "SEARCH RESULTS"}
                  </span>
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 text-[10px] font-bold">
                    {otherSectionLeads.length}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {otherSectionLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    isPinnedToday={lead.follow_up_status === "today"}
                    isOverdue={lead.follow_up_status === "overdue"}
                    onClick={() => handleSelectLead(lead)}
                  />
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* LEAD TIMELINE DIALOG MODAL */}
      {selectedLeadId && selectedLeadDetail && (
        <LeadTimelineModal
          leadId={selectedLeadId}
          initialLead={selectedLeadDetail}
          onClose={() => {
            setSelectedLeadId(null);
            setSelectedLeadDetail(null);
          }}
          onLeadUpdated={loadLeads}
        />
      )}

      {/* ADD NEW LEAD MODAL */}
      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onLeadCreated={loadLeads}
      />
    </div>
  );
}
