// ── Auth ──────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// ── Sentiment ─────────────────────────────────────────────────────────────────
export type SentimentLabel = "Positive" | "Negative" | "Neutral";

export interface KeywordScore {
  word: string;
  score: number;
  type: "positive" | "negative" | "neutral";
}

export interface SentimentResult {
  text: string;
  sentiment: SentimentLabel;
  confidence: number;
  model_used: string;
  scores: {
    positive: number;
    negative: number;
    neutral: number;
  };
  compound_score: number;
  keywords: KeywordScore[];
  processing_time_ms: number;
}

export interface BatchResult {
  results: SentimentResult[];
  count: number;
  model_used: string;
  summary: { positive: number; negative: number; neutral: number };
}

// ── History ───────────────────────────────────────────────────────────────────
export interface HistoryItem {
  id: string;
  user_id: string;
  user_email: string;
  text: string;
  sentiment: SentimentLabel;
  confidence: number;
  model_used?: string;
  scores: { positive: number; negative: number; neutral: number };
  compound_score: number;
  keywords: KeywordScore[];
  created_at: string;
}

export interface HistoryResponse {
  items: HistoryItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface StatsResponse {
  total: number;
  distribution: Record<SentimentLabel, number>;
  trend: Array<{ date: string; sentiment: SentimentLabel; count: number }>;
  top_negative_keywords?: Array<{ keyword: string; count: number }>;
  model_usage?: Record<string, number>;
  confidence_by_sentiment?: Record<string, { avg_confidence: number; count: number }>;
}

export interface AnalyticsResponse {
  total: number;
  distribution: Record<string, number>;
  trend: Array<{ date: string; sentiment: string; count: number }>;
  all_keywords: Array<{ word: string; count: number; type: string }>;
  confidence_by_sentiment: Record<string, number>;
  days: number;
}

// ── Chatbot ──────────────────────────────────────────────────────────────────
export interface ChatConversation {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export interface AdminData {
  total_users: number;
  total_analyses: number;
  sentiment_distribution: Record<string, number>;
  users: User[];
}

// ── Charts ────────────────────────────────────────────────────────────────────
export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}
