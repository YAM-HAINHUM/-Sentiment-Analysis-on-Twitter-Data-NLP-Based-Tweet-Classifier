import { useState, useEffect, useRef } from "react";
import { Send, Layers, RotateCcw, Copy, Check, Upload, Download, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { analyzeAPI } from "../api/client";
import { useAuth } from "../store/authStore";
import type { SentimentResult, BatchResult } from "../types";
import SentimentBadge from "../components/ui/SentimentBadge";
import ConfidenceBar from "../components/ui/ConfidenceBar";
import Spinner from "../components/ui/Spinner";
import { SENTIMENT_COLORS, formatConfidence } from "../utils/helpers";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const MODELS = [
  { value: "vader", label: "VADER (Fast)" },
  { value: "best",  label: "Best ML Model" },
  { value: "lr",    label: "Logistic Regression" },
  { value: "svm",   label: "SVM" },
  { value: "nb",    label: "Naive Bayes" },
];

const DEMO_TEXTS = [
  "This product is absolutely amazing! Best purchase I've made all year.",
  "Terrible quality. Broke after two days. Complete waste of money.",
  "It's okay. Nothing special, does what it's supposed to do.",
  "The customer service was incredibly helpful and resolved my issue quickly!",
  "Very disappointed. The product doesn't match the description at all.",
];

const card = { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 20 };
const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 12px", color: "var(--color-text)", width: "100%", outline: "none", resize: "none" as const, fontFamily: "inherit", fontSize: 13 };

type Mode = "single" | "batch" | "csv";

function ModelSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = MODELS.find(m => m.value === value) ?? MODELS[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", color: "var(--color-primary)" }}
      >
        {selected.label}
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 rounded-lg overflow-hidden shadow-xl"
          style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", minWidth: 160 }}>
          {MODELS.map(m => (
            <button key={m.value} onClick={() => { onChange(m.value); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs transition-all hover:bg-white/5"
              style={{ color: m.value === value ? "var(--color-primary)" : "var(--color-text)" }}>
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RealtimeBadge({ text }: { text: string }) {
  const [preview, setPreview] = useState<{ sentiment: string; color: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!text.trim() || text.length < 5) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {

      // Simple client-side heuristic for real-time preview (no API call)
      const lower = text.toLowerCase();
      const posWords = ["good","great","amazing","love","excellent","awesome","fantastic","happy","best","perfect","wonderful","brilliant"];
      const negWords = ["bad","terrible","awful","hate","worst","horrible","disgusting","disappointed","useless","broken","waste","poor"];
      const posCount = posWords.filter(w => lower.includes(w)).length;
      const negCount = negWords.filter(w => lower.includes(w)).length;
      if (posCount > negCount) setPreview({ sentiment: "Positive", color: "#10b981" });
      else if (negCount > posCount) setPreview({ sentiment: "Negative", color: "#ef4444" });
      else setPreview({ sentiment: "Neutral", color: "#f59e0b" });
    }, 400);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [text]);

  if (!preview) return null;
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium animate-pulse"
      style={{ color: preview.color, background: `${preview.color}20`, border: `1px solid ${preview.color}40` }}>
      ~{preview.sentiment}
    </span>
  );
}

export default function AnalysisPage() {
  const [text, setText] = useState("");
  const [model, setModel] = useState("vader");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SentimentResult | null>(null);
  const [copied, setCopied] = useState(false);
  const { isAuthenticated } = useAuth();
  const [mode, setMode] = useState<Mode>("single");
  const [batchTexts, setBatchTexts] = useState("");
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvResult, setCsvResult] = useState<BatchResult | null>(null);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [csvColumn, setCsvColumn] = useState("text");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) { toast.error("Enter some text to analyze"); return; }
    setLoading(true);
    try {
      const res = isAuthenticated
        ? await analyzeAPI.single(text.trim(), model)
        : await analyzeAPI.public(text.trim());
      setResult(res.data as SentimentResult);
    } catch { toast.error("Analysis failed. Is the backend running?"); }
    finally { setLoading(false); }
  };

  const handleBatchAnalyze = async () => {
    const lines = batchTexts.split("\n").map(l => l.trim()).filter(Boolean);
    if (!lines.length) { toast.error("Enter at least one text per line"); return; }
    setLoading(true);
    try {
      const res = await analyzeAPI.batch(lines, model);
      setBatchResult(res.data as BatchResult);
    } catch { toast.error("Batch analysis failed"); }
    finally { setLoading(false); }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) { toast.error("Select a CSV file first"); return; }
    setLoading(true);
    try {
      const res = await analyzeAPI.batchCsv(csvFile, csvColumn, model);
      const data = res.data as BatchResult & { columns: string[]; text_column: string };
      setCsvResult(data);
      if (data.columns) setCsvColumns(data.columns);
      toast.success(`Analyzed ${data.count} rows`);
    } catch { toast.error("CSV analysis failed"); }
    finally { setLoading(false); }
  };

  const handleExportCsv = async () => {
    try {
      const res = await analyzeAPI.exportBatchCsv();
      const blob = new Blob([res.data as BlobPart], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "batch_results.csv"; a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported!");
    } catch { toast.error("Export failed"); }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(`Sentiment: ${result.sentiment}\nConfidence: ${formatConfidence(result.confidence)}\nModel: ${result.model_used}\nCompound: ${result.compound_score}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
    toast.success("Copied!");
  };

  const radarData = result ? [
    { subject: "Positive", value: Math.round(result.scores.positive * 100) },
    { subject: "Negative", value: Math.round(result.scores.negative * 100) },
    { subject: "Neutral",  value: Math.round(result.scores.neutral * 100) },
  ] : [];

  const sentimentColor = result ? SENTIMENT_COLORS[result.sentiment] : "var(--color-primary)";

  const batchPieData = (batchResult ?? csvResult)?.summary
    ? [
        { name: "Positive", value: (batchResult ?? csvResult)!.summary.positive },
        { name: "Negative", value: (batchResult ?? csvResult)!.summary.negative },
        { name: "Neutral",  value: (batchResult ?? csvResult)!.summary.neutral },
      ]
    : [];

  const TOOLTIP_STYLE = {
    contentStyle: { background: "var(--color-surface)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 12 },
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Text Analysis</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>AI-powered sentiment analysis with multiple ML models</p>
        </div>
        <ModelSelector value={model} onChange={setModel} />
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        {(["single", "batch", "csv"] as Mode[]).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={mode === m ? { background: "var(--color-primary)", color: "#fff" } : { background: "rgba(255,255,255,0.06)", color: "var(--color-text-muted)" }}>
            {m === "single" ? "Single Text" : m === "batch" ? <span className="flex items-center gap-1.5"><Layers size={13} />Batch</span> : <span className="flex items-center gap-1.5"><Upload size={13} />CSV Upload</span>}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div style={card} className="space-y-4">
          {mode === "single" && (
            <>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Input Text</label>
                <div className="flex items-center gap-2">
                  <RealtimeBadge text={text} />
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{text.length}/10000</span>
                </div>
              </div>
              <textarea value={text} onChange={e => setText(e.target.value)}
                placeholder="Paste your review, tweet, or any text here…"
                maxLength={10000} rows={8} style={inputStyle} />
              <div>
                <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>Try a sample</p>
                <div className="flex flex-wrap gap-1.5">
                  {DEMO_TEXTS.map((t, i) => (
                    <button key={i} onClick={() => setText(t)}
                      className="text-xs px-2.5 py-1 rounded-md transition-all truncate max-w-xs"
                      style={{ background: "rgba(255,255,255,0.06)", color: "var(--color-text-muted)" }} title={t}>
                      Sample {i + 1}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleAnalyze} disabled={loading || !text.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-white text-sm font-semibold transition-all disabled:opacity-50"
                  style={{ background: "var(--color-primary)" }}>
                  {loading ? <Spinner size={15} /> : <Send size={15} />}
                  {loading ? "Analyzing…" : "Analyze"}
                </button>
                <button onClick={() => { setText(""); setResult(null); }}
                  className="p-2.5 rounded-lg transition-all"
                  style={{ background: "rgba(255,255,255,0.06)", color: "var(--color-text-muted)" }}>
                  <RotateCcw size={15} />
                </button>
              </div>
            </>
          )}

          {mode === "batch" && (
            <>
              <label className="text-xs font-medium uppercase tracking-wider block" style={{ color: "var(--color-text-muted)" }}>Batch Input (one text per line)</label>
              <textarea value={batchTexts} onChange={e => setBatchTexts(e.target.value)}
                placeholder={"Great product!\nTerrible experience.\nIt's okay I guess."} rows={10}
                style={{ ...inputStyle, fontFamily: "ui-monospace, monospace" }} />
              <button onClick={handleBatchAnalyze} disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white text-sm font-semibold transition-all disabled:opacity-50"
                style={{ background: "var(--color-primary)" }}>
                {loading ? <Spinner size={15} /> : <Layers size={15} />}
                {loading ? "Processing…" : "Analyze All"}
              </button>
            </>
          )}

          {mode === "csv" && (
            <>
              <label className="text-xs font-medium uppercase tracking-wider block" style={{ color: "var(--color-text-muted)" }}>Upload CSV File</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3 rounded-xl cursor-pointer transition-all"
                style={{ border: "2px dashed rgba(124,58,237,0.3)", padding: "32px 16px", background: csvFile ? "rgba(124,58,237,0.05)" : "transparent" }}
              >
                <Upload size={24} style={{ color: "var(--color-primary)", opacity: 0.7 }} />
                <div className="text-center">
                  <p className="text-sm font-medium text-white">{csvFile ? csvFile.name : "Click to upload CSV"}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>Max 500 rows · UTF-8 or Latin-1</p>
                </div>
                <input ref={fileRef} type="file" accept=".csv" className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) { setCsvFile(f); setCsvResult(null); }
                  }} />
              </div>
              {csvColumns.length > 0 && (
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: "var(--color-text-muted)" }}>Text Column</label>
                  <select value={csvColumn} onChange={e => setCsvColumn(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}>
                    {csvColumns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={handleCsvUpload} disabled={loading || !csvFile}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-white text-sm font-semibold transition-all disabled:opacity-50"
                  style={{ background: "var(--color-primary)" }}>
                  {loading ? <Spinner size={15} /> : <Upload size={15} />}
                  {loading ? "Analyzing…" : "Analyze CSV"}
                </button>
                {csvResult && (
                  <button onClick={handleExportCsv}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                    style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981" }}>
                    <Download size={14} /> Export
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Result Panel */}
        <div style={card} className="space-y-5">
          {mode === "single" ? (
            result ? (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <SentimentBadge sentiment={result.sentiment} />
                    <p className="text-xs mt-1.5" style={{ color: "var(--color-text-muted)" }}>
                      {result.processing_time_ms.toFixed(1)}ms · {result.model_used} · Compound: {result.compound_score}
                    </p>
                  </div>
                  <button onClick={handleCopy} className="p-1.5 rounded-md transition-colors"
                    style={{ background: "rgba(255,255,255,0.06)", color: "var(--color-text-muted)" }}>
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
                <ConfidenceBar value={result.confidence} sentiment={result.sentiment} label="Confidence" />
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Score Breakdown</p>
                  {(["positive", "negative", "neutral"] as const).map(k => (
                    <div key={k} className="flex items-center gap-3">
                      <span className="text-xs w-14 capitalize" style={{ color: "var(--color-text-muted)" }}>{k}</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.round(result.scores[k] * 100)}%`, background: k === "positive" ? "#10b981" : k === "negative" ? "#ef4444" : "#f59e0b" }} />
                      </div>
                      <span className="text-xs font-mono w-8 text-right" style={{ color: "var(--color-text-muted)" }}>{Math.round(result.scores[k] * 100)}%</span>
                    </div>
                  ))}
                </div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                      <Radar dataKey="value" stroke={sentimentColor} fill={sentimentColor} fillOpacity={0.25} />
                      <Tooltip {...TOOLTIP_STYLE} formatter={(v: unknown) => [`${v}%`, "Score"]} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                {result.keywords.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>Key Influencers</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.keywords.map((kw, i) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{ color: kw.type === "positive" ? "#10b981" : kw.type === "negative" ? "#ef4444" : "#f59e0b", background: kw.type === "positive" ? "#10b98120" : kw.type === "negative" ? "#ef444420" : "#f59e0b20" }}>
                          {kw.word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>🧠</div>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Results will appear here after analysis</p>
              </div>
            )
          ) : (
            /* Batch / CSV results */
            (() => {
              const activeResult = mode === "batch" ? batchResult : csvResult;
              if (!activeResult) return (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
                  <span className="text-3xl">{mode === "csv" ? "📂" : "📋"}</span>
                  <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                    {mode === "csv" ? "Upload and analyze a CSV file" : "Batch results will appear here"}
                  </p>
                </div>
              );
              return (
                <div className="space-y-4">
                  {/* Summary pie */}
                  <div>
                    <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>
                      Summary — {activeResult.count} texts
                    </p>
                    <div className="h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={batchPieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                            {batchPieData.map(entry => <Cell key={entry.name} fill={SENTIMENT_COLORS[entry.name as keyof typeof SENTIMENT_COLORS]} />)}
                          </Pie>
                          <Tooltip {...TOOLTIP_STYLE} />
                          <Legend formatter={v => <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{v}</span>} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  {/* Results list */}
                  <div className="space-y-1.5 overflow-y-auto" style={{ maxHeight: 280 }}>
                    {activeResult.results.map((r, i) => (
                      <div key={i} className="rounded-lg p-3 space-y-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <div className="flex items-center gap-2 justify-between">
                          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>#{i + 1}</span>
                          <SentimentBadge sentiment={r.sentiment} size="sm" />
                          <span className="text-xs font-mono" style={{ color: "var(--color-text-muted)" }}>{formatConfidence(r.confidence)}</span>
                        </div>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>{r.text.slice(0, 100)}{r.text.length > 100 ? "…" : ""}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
}
