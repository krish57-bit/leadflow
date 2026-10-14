export type LeadStatus =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Proposal Sent"
  | "Won"
  | "Lost";

export type FollowUpStatus = "today" | "overdue" | "upcoming" | "none";

export interface AIAnalysis {
  detected_intent: string;
  sentiment: string;
  financial_topics: string[];
  suggested_follow_up_date?: string | null;
  suggested_follow_up_display?: string | null;
  next_best_action: string;
  recommended_status?: LeadStatus | null;
  reasoning_trace: string[];
}

export interface Discussion {
  id: number;
  lead_id: number;
  note: string;
  activity_type?: "call" | "meeting" | "proposal" | "note" | "inbound" | string;
  follow_up_date?: string | null;
  ai_analysis?: string | null;
  created_at: string;
  time_ago?: string | null;
}

export interface LeadSummary {
  id: number;
  name: string;
  company?: string | null;
  phone?: string | null;
  status: LeadStatus;
  follow_up_date?: string | null;
  follow_up_status: FollowUpStatus;
  best_time_to_contact?: string | null;
  last_discussion_note?: string | null;
  last_discussion_at?: string | null;
  time_ago?: string | null;
  discussions_count: number;
  created_at: string;
  updated_at: string;
}

export interface LeadDetail extends LeadSummary {
  discussions: Discussion[];
}

export interface CreateLeadPayload {
  name: string;
  company?: string;
  phone?: string;
  status?: LeadStatus;
  initial_note?: string;
  activity_type?: string;
  follow_up_date?: string;
}

export interface CreateDiscussionPayload {
  note: string;
  activity_type?: string;
  follow_up_date?: string | null;
  ai_analysis?: string | null;
}
