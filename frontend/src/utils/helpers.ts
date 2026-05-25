import { type SentimentLabel } from "../types";

export const SENTIMENT_COLORS: Record<SentimentLabel, string> = {
  Positive: "#10b981",
  Negative: "#ef4444",
  Neutral:  "#f59e0b",
};

export const SENTIMENT_BG: Record<SentimentLabel, string> = {
  Positive: "rgba(16,185,129,0.15)",
  Negative: "rgba(239,68,68,0.15)",
  Neutral:  "rgba(245,158,11,0.15)",
};

export const SENTIMENT_ICONS: Record<SentimentLabel, string> = {
  Positive: "😊",
  Negative: "😞",
  Neutral:  "😐",
};

export function formatConfidence(conf: number): string {
  return `${(conf * 100).toFixed(1)}%`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function truncateText(text: string, maxLen = 80): string {
  return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
}

export function getSentimentEmoji(sentiment: SentimentLabel): string {
  return SENTIMENT_ICONS[sentiment] ?? "❓";
}

export function downloadCSV(csvContent: string, filename = "export.csv") {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
