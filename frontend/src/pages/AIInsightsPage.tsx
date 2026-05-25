import { useEffect, useMemo, useState } from "react";
import { AlertCircle, TrendingUp, Activity, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { emotionsAPI, insightsAPI } from "../api/client";

import Spinner from "../components/ui/Spinner";
import EmotionBadges from "../components/insights/EmotionBadges";
import AlertBanner from "../components/insights/AlertBanner";

interface InsightsResponse {
  summary: string;
  insights: string[];
  recommendations: string[];
  [k: string]: unknown;
}

const cardStyle = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  padding: 20,
};

export default function AIInsightsPage() {
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [emotionDist, setEmotionDist] = useState<Partial<Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [error, setError] = useState<string | null>(null);

  const alertMessage = useMemo(() => {
    const angry = emotionDist.angry ?? 0;
    const sad = emotionDist.sad ?? 0;
    const negLike = angry + sad;
    if (!negLike) return "";
    return `⚠️ Negative emotions are prominent (${Math.round(negLike)}% combined Angry+Sad).`;
  }, [emotionDist]);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [iRes, eRes] = await Promise.all([
          insightsAPI.get({ days }),
          emotionsAPI.get(days),
        ]);
        setInsights(iRes.data as InsightsResponse);
        setEmotionDist((eRes.data?.distribution ?? {}) as Partial<Record<string, number>>);
      } catch {
        toast.error("Failed to load AI insights");
        setError("Failed to load AI insights");
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [days]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [iRes, eRes] = await Promise.all([
        insightsAPI.get({ days }),
        emotionsAPI.get(days),
      ]);
      setInsights(iRes.data as InsightsResponse);
      setEmotionDist((eRes.data?.distribution ?? {}) as Partial<Record<string, number>>);
      toast.success("Insights refreshed");
    } catch {
      toast.error("Failed to refresh insights");
      setError("Failed to refresh insights");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <Spinner size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">🤖 AI Insights</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Intelligent analysis of your recent sentiment data ({days} days)
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-1.5 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm"
          >
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>

          <button
            onClick={refresh}
            className="p-2 rounded-lg"
            style={{ background: "rgba(255,255,255,0.06)", color: "var(--color-text-muted)" }}
            aria-label="Refresh insights"
          >
            <TrendingUp size={16} />
          </button>
        </div>
      </div>

      <AlertBanner show={!!alertMessage} message={alertMessage || ""} />

      {error && (
        <div
          className="p-4 rounded-xl"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)" }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} style={{ color: "#fca5a5" }} />
            <div>
              <p className="text-sm font-medium" style={{ color: "#fecaca" }}>
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {insights ? (
        <>
          <div style={cardStyle}>
            <h3 className="text-lg font-semibold mb-3 text-white flex items-center gap-2">
              <Activity size={18} /> Executive Summary
            </h3>
            <p style={{ color: "var(--color-text)" }}>{insights.summary}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div style={cardStyle}>
              <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                <AlertCircle size={18} /> Key Insights
              </h3>
              <div className="space-y-3">
                {insights.insights.map((insight, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}
                  >
                    <div className="w-2 h-2 mt-2 bg-purple-400 rounded-full flex-shrink-0" />
                    <p className="text-sm leading-relaxed">{String(insight)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={cardStyle}>
              <h3 className="text-lg font-semibold mb-4 text-white">Emotion Snapshot</h3>
              <EmotionBadges
                distribution={emotionDist as Partial<Record<"happy" | "sad" | "angry" | "excited", number>>}
              />

              <div className="h-4" />

              <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">📡 Recommendations</h3>
              <div className="space-y-3">
                {insights.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl"
                    style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}
                  >
                    <p className="text-sm font-medium text-emerald-100">{String(rec)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-xs text-center py-4" style={{ color: "var(--color-text-muted)" }}>
            Powered by GPT + Advanced ML Models • Data from your last {days} days
          </div>
        </>
      ) : (
        <div className="text-center py-16" style={{ color: "var(--color-text-muted)" }}>
          <AlertCircle size={48} className="mx-auto mb-4 opacity-40" />
          <p className="text-lg">No insights available</p>
          <p className="mt-2">Analyze some texts first to unlock AI-powered insights</p>
        </div>
      )}
    </div>
  );
}

