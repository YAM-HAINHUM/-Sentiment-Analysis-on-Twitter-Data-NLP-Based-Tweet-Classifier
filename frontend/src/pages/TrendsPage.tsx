import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Calendar,
  Hash,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import toast from "react-hot-toast";
import Spinner from "../components/ui/Spinner";
import { historyAPI } from "../api/client";
import { SENTIMENT_COLORS } from "../utils/helpers";
import type { SentimentLabel } from "../types";
import AlertBanner from "../components/insights/AlertBanner";
import {
  CartesianGrid,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  AreaChart,
  Area,
} from "recharts";

type TrendsPoint = { date: string; sentiment: SentimentLabel; count: number };

type TrendsSeriesRow = {
  date: string; // MM-DD
  isoDate: string; // YYYY-MM-DD
  Positive: number;
  Negative: number;
  Neutral: number;
};

type KeywordsTrendResponse = {
  days: number;
  top: number;
  positive: { date: string; keywords: { word: string; count: number }[] }[];
  negative: { date: string; keywords: { word: string; count: number }[] }[];
};

type TweetsByDateResponse = {
  date: string;
  tweets: {
    id: string;
    text: string;
    sentiment: string;
    confidence?: number;
    compound_score?: number;
    created_at?: string;
  }[];
  count: number;
  limit: number;
};

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "var(--color-surface)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    color: "#fff",
    fontSize: 12,
  },
} as const;

const cardStyle: React.CSSProperties = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  padding: 20,
};

const cardHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 16,
} as const;

function formatPercentChange(current: number, previous: number) {
  if (previous === 0) {
    if (current === 0) return 0;
    return 100; // treat from 0 -> non-zero as 100%
  }
  return ((current - previous) / previous) * 100;
}

function mmddFromIso(iso: string) {
  // iso = YYYY-MM-DD
  return iso.slice(5);
}

function buildTrendSeries(trend: TrendsPoint[]): TrendsSeriesRow[] {
  const dateMap: Record<
    string,
    { Positive?: number; Negative?: number; Neutral?: number }
  > = {};

  for (const item of trend) {
    const iso = item.date.slice(0, 10);
    if (!dateMap[iso]) dateMap[iso] = {};
    dateMap[iso][item.sentiment] = item.count;
  }

  return Object.entries(dateMap)
    .map(([isoDate, vals]) => ({
      isoDate,
      date: mmddFromIso(isoDate),
      Positive: vals.Positive ?? 0,
      Negative: vals.Negative ?? 0,
      Neutral: vals.Neutral ?? 0,
    }))
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate));
}

function movingAverage(values: number[], window: number) {
  const out: number[] = new Array(values.length).fill(0);
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    const avg = slice.reduce((s, v) => s + v, 0) / Math.max(1, slice.length);
    out[i] = avg;
  }
  return out;
}

function mean(arr: number[]) {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function stddev(arr: number[]) {
  if (arr.length <= 1) return 0;
  const m = mean(arr);
  const v = mean(arr.map((x) => (x - m) ** 2));
  return Math.sqrt(v);
}

function addDaysIso(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function linearRegressionPredict(y: number[], futureSteps: number) {
  // x = 0..n-1
  const n = y.length;
  if (n < 2) return [] as number[];
  const xs = Array.from({ length: n }, (_, i) => i);
  const xMean = mean(xs);
  const yMean = mean(y);
  const num = xs.reduce((s, x, i) => s + (x - xMean) * (y[i] - yMean), 0);
  const den = xs.reduce((s, x) => s + (x - xMean) ** 2, 0);
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;

  const preds: number[] = [];
  for (let k = 0; k < futureSteps; k++) {
    const x = n + k;
    preds.push(intercept + slope * x);
  }
  return preds;
}

function computeSpikeDates(rows: TrendsSeriesRow[], window = 7, k = 2) {
  const neg = rows.map((r) => r.Negative);
  const spikes: { isoDate: string; severity: number; value: number }[] = [];

  for (let i = 0; i < neg.length; i++) {
    const start = Math.max(0, i - window);
    const baselineSlice = neg.slice(start, i + 1);
    const baselineMean = mean(baselineSlice);
    const baselineStd = stddev(baselineSlice);
    const threshold = baselineMean + k * baselineStd;

    if (neg[i] > threshold && neg[i] > 0) {
      const severity = baselineStd === 0 ? 1 : (neg[i] - baselineMean) / baselineStd;
      spikes.push({ isoDate: rows[i].isoDate, severity, value: neg[i] });
    }
  }
  return spikes;
}

export default function TrendsPage() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState<TrendsPoint[]>([]);
  const [keywordsTrend, setKeywordsTrend] = useState<KeywordsTrendResponse | null>(null);

  const [spikeBanner, setSpikeBanner] = useState<{ show: boolean; date?: string }>(
    { show: false }
  );

  const [tweetsDrawerOpen, setTweetsDrawerOpen] = useState(false);
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(null);
  const [tweetsLoading, setTweetsLoading] = useState(false);
  const [tweetsByDate, setTweetsByDate] = useState<TweetsByDateResponse | null>(null);

  const series = useMemo(() => buildTrendSeries(trend), [trend]);

  const negativeMA = useMemo(() => movingAverage(series.map((r) => r.Negative), 5), [
    series,
  ]);

  const prediction = useMemo(() => {
    const futureSteps = 5;
    const neg = series.map((r) => r.Negative);
    const preds = linearRegressionPredict(neg, futureSteps);
    if (preds.length === 0) return null;

    const lastIso = series[series.length - 1]?.isoDate;
    if (!lastIso) return null;

    const rows = preds.map((v, i) => {
      const isoDate = addDaysIso(lastIso, i + 1);
      return {
        date: mmddFromIso(isoDate),
        isoDate,
        NegativePred: Math.max(0, v),
      };
    });
    return rows;
  }, [series]);

  const spikeDates = useMemo(() => computeSpikeDates(series, 7, 2), [series]);

  useEffect(() => {
    if (spikeDates.length > 0) {
      setSpikeBanner({ show: true, date: spikeDates[0].isoDate });
    } else {
      setSpikeBanner({ show: false, date: undefined });
    }
  }, [spikeDates]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [a, kw] = await Promise.all([
          historyAPI.analytics(days),
          historyAPI.keywordsTrend(days, 8),
        ]);
        if (!mounted) return;
        setTrend((a.data?.trend ?? []) as TrendsPoint[]);
        setKeywordsTrend(kw.data as KeywordsTrendResponse);
      } catch {
        toast.error("Failed to load trends");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [days]);

  const comparison = useMemo(() => {
    // Compare last 7 vs previous 7, last 30 vs previous 30
    if (series.length === 0) return null;

    const isoDates = series.map((r) => r.isoDate);
    const endIso = isoDates[isoDates.length - 1];
    const parseIso = (iso: string) => new Date(iso + "T00:00:00Z");
    const endDate = parseIso(endIso);

    const windowStats = (windowDays: number) => {
      const lastStart = new Date(endDate);
      lastStart.setUTCDate(lastStart.getUTCDate() - (windowDays - 1));

      const prevEnd = new Date(lastStart);
      prevEnd.setUTCDate(prevEnd.getUTCDate() - 1);

      const prevStart = new Date(prevEnd);
      prevStart.setUTCDate(prevStart.getUTCDate() - (windowDays - 1));

      const inRange = (iso: string, start: Date, end: Date) => {
        const d = parseIso(iso);
        return d >= start && d <= end;
      };

      const sumIn = (start: Date, end: Date) => {
        let pos = 0,
          neg = 0,
          neu = 0;
        for (const r of series) {
          if (inRange(r.isoDate, start, end)) {
            pos += r.Positive;
            neg += r.Negative;
            neu += r.Neutral;
          }
        }
        return { pos, neg, neu };
      };

      const last = sumIn(lastStart, endDate);
      const prev = sumIn(prevStart, prevEnd);
      return { last, prev };
    };

    const c7 = windowStats(7);
    const c30 = windowStats(30);

    const toPercentRow = (label: string, cur: number, prev: number) => {
      const pct = formatPercentChange(cur, prev);
      return { label, pct };
    };

    return {
      c7: {
        positive: toPercentRow(
          "Positive",
          c7.last.pos,
          c7.prev.pos
        ),
        negative: toPercentRow(
          "Negative",
          c7.last.neg,
          c7.prev.neg
        ),
      },
      c30: {
        positive: toPercentRow(
          "Positive",
          c30.last.pos,
          c30.prev.pos
        ),
        negative: toPercentRow(
          "Negative",
          c30.last.neg,
          c30.prev.neg
        ),
      },
    };
  }, [series]);

  const autoInsights = useMemo(() => {
    if (series.length < 6) return [] as string[];

    const split = Math.floor(series.length / 2);
    const first = series.slice(0, split);
    const last = series.slice(split);

    const avgPosFirst = mean(first.map((r) => r.Positive));
    const avgPosLast = mean(last.map((r) => r.Positive));
    const avgNegFirst = mean(first.map((r) => r.Negative));
    const avgNegLast = mean(last.map((r) => r.Negative));

    const improving = avgPosLast > avgPosFirst;
    const negDecreasing = avgNegLast < avgNegFirst;

    const spikes = spikeDates.length;

    const insights: string[] = [];
    insights.push(
      improving
        ? "Sentiment improving over time"
        : "Sentiment is trending flat or declining"
    );
    insights.push(
      negDecreasing
        ? "Negative sentiment decreasing steadily"
        : "Negative sentiment increasing or volatile"
    );
    if (spikes > 0) insights.push(`⚠️ ${spikes} negative spike(s) detected`);

    return insights;
  }, [series, spikeDates.length]);

  const trendingKeywords = useMemo(() => {
    if (!keywordsTrend) return { positive: [] as string[], negative: [] as string[] };

    const pos = keywordsTrend.positive;
    const neg = keywordsTrend.negative;

    const pickIncreasing = (
      rows: { date: string; keywords: { word: string; count: number }[] }[]
    ) => {
      // heuristic: compare last day's count vs first day's count for each keyword
      if (rows.length === 0) return [] as string[];
      const first = rows[0].keywords;
      const last = rows[rows.length - 1].keywords;

      const firstMap = new Map(first.map((k) => [k.word, k.count]));
      const deltas = last
        .map((k) => {
          const prev = firstMap.get(k.word) ?? 0;
          return { word: k.word, delta: k.count - prev };
        })
        .sort((a, b) => b.delta - a.delta)
        .slice(0, 6)
        .filter((x) => x.delta > 0);

      return deltas.map((d) => d.word);
    };

    return {
      positive: pickIncreasing(pos),
      negative: pickIncreasing(neg),
    };
  }, [keywordsTrend]);

  const combinedChartData = useMemo(() => {
    // Chart main data uses series; then overlay prediction via separate line data.
    // For prediction, Recharts can use a custom data array; we keep it simple.
    return series.map((r, i) => ({
      ...r,
      NegativeMA: negativeMA[i] ?? 0,
    }));
  }, [series, negativeMA]);

  const handlePointClick = async (payload: any) => {
    const isoDate: string | undefined = payload?.payload?.isoDate;
    if (!isoDate) return;

    setSelectedDateIso(isoDate);
    setTweetsDrawerOpen(true);
    setTweetsLoading(true);
    setTweetsByDate(null);

    try {
      const res = await historyAPI.tweetsByDate(isoDate, 200);
      setTweetsByDate(res.data as TweetsByDateResponse);
    } catch {
      toast.error("Failed to load tweets for that date");
      setTweetsDrawerOpen(false);
    } finally {
      setTweetsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <Spinner size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Trends / Analytics</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Advanced time-series comparison, anomaly detection, and forecasting
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar size={14} style={{ color: "var(--color-text-muted)" }} />
          {[7, 14, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium"
              style={
                days === d
                  ? { background: "var(--color-primary)", color: "#fff" }
                  : {
                      background: "rgba(255,255,255,0.06)",
                      color: "var(--color-text-muted)",
                    }
              }
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <AlertBanner
        show={spikeBanner.show}
        message={
          spikeBanner.date
            ? `⚠️ Negative spike detected on ${spikeBanner.date}`
            : "⚠️ Negative spike detected"
        }
      />

      {/* Auto insights */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <Activity size={16} style={{ color: "var(--color-primary)" }} />
          <h2 className="text-sm font-semibold text-white">Auto Insights</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {autoInsights.length > 0 ? (
            autoInsights.map((s, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  background: "rgba(124,58,237,0.12)",
                  border: "1px solid rgba(124,58,237,0.25)",
                  color: "rgba(255,255,255,0.9)",
                }}
              >
                {s}
              </span>
            ))
          ) : (
            <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Not enough data for insights.
            </div>
          )}
        </div>
      </div>

      {/* Time comparison */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <TrendingUp size={16} style={{ color: "var(--color-primary)" }} />
          <h2 className="text-sm font-semibold text-white">Time Comparison</h2>
        </div>

        {!comparison ? (
          <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Not enough data.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {(
              [
                { label: "Last 7 days", ...comparison.c7 },
                { label: "Last 30 days", ...comparison.c30 },
              ] as const
            ).map((block) => (
              <div
                key={block.label}
                className="rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--color-border)" }}
              >
                <div className="px-4 py-3">
                  <div className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
                    {block.label}
                  </div>
                  <div className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.95)" }}>
                    <div>
                      Positive sentiment{" "}
                      {block.positive.pct >= 0 ? "increased" : "decreased"} by{" "}
                      {Math.abs(block.positive.pct).toFixed(1)}%
                    </div>
                    <div className="mt-1">
                      Negative sentiment{" "}
                      {block.negative.pct >= 0 ? "increased" : "decreased"} by{" "}
                      {Math.abs(block.negative.pct).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main chart */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <TrendingDown size={16} style={{ color: "#ef4444" }} />
          <h2 className="text-sm font-semibold text-white">Negative Trend (with MA + Spikes + Prediction)</h2>
        </div>

        {combinedChartData.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-sm" style={{ color: "var(--color-text-muted)" }}>
            Not enough data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={combinedChartData}>
              <defs>
                {(["Positive", "Negative", "Neutral"] as SentimentLabel[]).map((s) => (
                  <linearGradient
                    key={s}
                    id={`grad-${s}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor={SENTIMENT_COLORS[s]} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={SENTIMENT_COLORS[s]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(value: any, name: any) => [value, name]}
                labelFormatter={(label: any, payload: any) => {
                  const idx = payload?.[0]?.payload?.isoDate;
                  return idx ? idx : label;
                }}
              />

              <Legend
                formatter={(v) => (
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{v}</span>
                )}
              />

              {/* Keep other sentiment areas but emphasize Negative */}
              <Area type="monotone" dataKey="Positive" stroke={SENTIMENT_COLORS.Positive} fill="url(#grad-Positive)" strokeWidth={1.5} dot={false} opacity={0.65} />
              <Area type="monotone" dataKey="Negative" stroke={SENTIMENT_COLORS.Negative} fill="url(#grad-Negative)" strokeWidth={2} dot={true} onClick={handlePointClick} />
              <Area type="monotone" dataKey="Neutral" stroke={SENTIMENT_COLORS.Neutral} fill="url(#grad-Neutral)" strokeWidth={1.5} dot={false} opacity={0.35} />

              {/* Moving average line for Negative */}
              <Line
                type="monotone"
                dataKey="NegativeMA"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                strokeDasharray="6 4"
                name="Negative MA"
              />

              {/* Spike markers */}
              {spikeDates.slice(0, 6).map((s) => {
                const mmdd = mmddFromIso(s.isoDate);
                return (
                  <ReferenceDot
                    key={s.isoDate}
                    x={mmdd}
                    y={s.value}
                    r={6}
                    fill="#ef4444"
                    stroke="#fff"
                    strokeWidth={1}
/>

                );
              })}

              {/* Prediction: dotted line overlay using separate data */}
              {prediction && prediction.length > 0 && (
                <Line
                  type="monotone"
                  data={prediction}
                  dataKey="NegativePred"
                  stroke="#a78bfa"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="3 6"
                  name="Predicted Negative"
                  xAxisId={0 as any}
                  connectNulls
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Keyword trends */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <Hash size={16} style={{ color: "var(--color-primary)" }} />
          <h2 className="text-sm font-semibold text-white">Trending Keywords Over Time</h2>
        </div>

        {!keywordsTrend ? (
          <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Loading keywords...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div
              className="rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--color-border)" }}
            >
              <div className="px-4 py-3">
                <div className="text-xs font-semibold" style={{ color: "#10b981" }}>Positive keywords</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {trendingKeywords.positive.length ? (
                    trendingKeywords.positive.map((w) => (
                      <span
                        key={w}
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}
                      >
                        {w}
                      </span>
                    ))
                  ) : (
                    <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                      No increasing keywords found.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div
              className="rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--color-border)" }}
            >
              <div className="px-4 py-3">
                <div className="text-xs font-semibold" style={{ color: "#ef4444" }}>Negative keywords</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {trendingKeywords.negative.length ? (
                    trendingKeywords.negative.map((w) => (
                      <span
                        key={w}
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}
                      >
                        {w}
                      </span>
                    ))
                  ) : (
                    <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                      No increasing keywords found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Drill-down drawer */}
      {tweetsDrawerOpen && (
        <div
          className="fixed inset-0 z-50"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={() => setTweetsDrawerOpen(false)}
        >
          <div
            className="absolute right-0 top-0 h-full"
            style={{ width: 520, background: "var(--color-surface)", borderLeft: "1px solid var(--color-border)", padding: 16 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-white font-bold">Tweets for {selectedDateIso}</div>
                <div className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
                  Click a date point on the chart to drill down.
                </div>
              </div>
              <button
                className="px-3 py-1 rounded-lg text-xs font-semibold"
                style={{ background: "rgba(255,255,255,0.06)", color: "var(--color-text)" }}
                onClick={() => setTweetsDrawerOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="mt-4">
              {tweetsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Spinner size={24} />
                </div>
              ) : tweetsByDate ? (
                <div className="space-y-3 overflow-auto" style={{ maxHeight: "calc(100vh - 150px)" }}>
                  {tweetsByDate.tweets.length ? (
                    tweetsByDate.tweets.map((t) => (
                      <div
                        key={t.id}
                        className="rounded-xl px-3 py-2"
                        style={{ border: "1px solid var(--color-border)", background: "rgba(255,255,255,0.03)" }}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className="text-xs font-semibold"
                            style={{
                              color:
                                t.sentiment === "Positive"
                                  ? SENTIMENT_COLORS.Positive
                                  : t.sentiment === "Negative"
                                    ? SENTIMENT_COLORS.Negative
                                    : SENTIMENT_COLORS.Neutral,
                            }}
                          >
                            {t.sentiment}
                          </div>
                          <div className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                            conf {t.confidence ?? "—"}
                          </div>
                        </div>
                        <div className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.95)" }}>
                          {t.text}
                        </div>
                        {t.created_at && (
                          <div className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.55)" }}>
                            {t.created_at}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                      No tweets found for this date.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  No data.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


