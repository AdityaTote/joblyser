export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface User {
  id: string;
  profile_id?: string;
  email: string;
  password?: string;
  access_token?: string;
  refresh_token?: string;
  name?: string;
  job_title?: string;
  description?: string;
  bio?: string;
  resume_text?: string;
  resume_key?: string;
  primary_resume_key?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  name: string;
  job_title: string;
  description: string;
  resume_key: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyInfo {
  summary?: string;
  industry?: string;
  culture?: string;
  products?: string[];
  opportunities?: string[];
  risks?: string[];
  references?: string[];
}

export interface RoleFitComparisonBreakdown {
  required_total: number;
  required_matched: number;
  preferred_total: number;
  preferred_matched: number;
  responsibilities_total: number;
  responsibilities_matched: number;
  soft_skills_total: number;
  soft_skills_matched: number;
  critical_gaps_count: number;
}

export interface MatchedRequirement {
  requirement: string;
  requirement_type: string;
  match_strength: string;
  evidence: string;
}

export interface UnmatchedRequirement {
  requirement: string;
  requirement_type: string;
  importance: string;
  why_unmatched: string;
  action_to_close_gap: string;
}

export interface RoleFitOutput {
  role_fit_summary: string;
  match_score: number;
  decision: string;
  decision_conditions: string[];
  comparison_breakdown: RoleFitComparisonBreakdown;
  matched_requirements: MatchedRequirement[];
  unmatched_requirements: UnmatchedRequirement[];
  all_key_requirements_considered: string[];
  must_have_gaps: string[];
  recommended_actions_before_applying: string[];
  confidence: string;
}

export interface CoverLetterHeader {
  candidate_name: string;
  email: string;
  phone?: string;
  github_url?: string;
  linkedin_url?: string;
  date: string;
  company_name: string;
  role_title: string;
}

export interface CoverLetterBody {
  paragraph_1_hook: string;
  paragraph_2_proof: string;
  paragraph_3_company_fit: string;
  paragraph_4_complete_picture: string;
  paragraph_5_cta: string;
}

export interface CoverLetterSignOff {
  closing: string;
  candidate_name: string;
  github_url?: string;
  linkedin_url?: string;
}

export interface CoverLetterContent {
  header: CoverLetterHeader;
  body: CoverLetterBody;
  sign_off: CoverLetterSignOff;
  edited_text?: string;
}

export interface LinkedInNoteContent {
  recruiter_name?: string;
  candidate_name: string;
  role_title: string;
  company_name: string;
  hook: string;
  note: string;
  character_count: number;
  edited_text?: string;
}

export interface ColdMail {
  subject: string;
  email_body: string;
  edited_text?: string;
}

export type AgentResult =
  | { type: "review"; what_is_job: string; search_company: CompanyInfo; role_fit: RoleFitOutput }
  | { type: "apply_note"; application_note: string }
  | { type: "cover_letter"; cover_letter: CoverLetterContent }
  | { type: "linkedin_note"; linkedin_note: LinkedInNoteContent }
  | { type: "cold_mail"; cold_mail: ColdMail };

export interface SessionResponse {
  id: string;
  user_id: string;
  session_id: string;
  jd_text: string;
  doc_key: string;
  user_query: string;
  agent_result: AgentResult | null;
  created_at: string;
  updated_at?: string;
}

export type Session = SessionResponse;
export type Job = JobStatusResponse;

export interface SessionsResponse {
  id: string;
  user_id: string;
  created_at: string;
}

export interface JobStatusResponse {
  id: string;
  status: string;
  session_id: string;
  chat_id: string | null;
}

export interface Document {
  id: string;
  key: string;
  user_id: string;
  link?: string;
  created_at: string;
  updated_at: string;
}

export interface UploadedDocument {
  documentId: string;
  key: string;
  url: string;
}

export interface AuthResponse {
  userId: string;
  email: string;
  token: string;
}

export interface RagRetrievalRequest {
  document_type: string;
  user_query: string;
  key: string;
}

export interface AgentRunRequest {
  action: string;
  user_query: string;
  jd_text: string;
  doc_key: string;
  session_id?: string;
}

export interface RunAgentResponse {
  job_id: string;
  session_id: string;
  status: string;
}

export interface EditChatRequest {
  session_id: string;
  edited_text: string;
}
