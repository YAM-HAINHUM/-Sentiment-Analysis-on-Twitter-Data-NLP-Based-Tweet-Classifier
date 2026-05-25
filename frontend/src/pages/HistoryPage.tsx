import { useEffect, useState, useCallback } from "react";
import { Search, Download, Trash2, Filter, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import { historyAPI } from "../api/client";
import type { HistoryResponse, HistoryItem, SentimentLabel } from "../types";
import SentimentBadge from "../components/ui/SentimentBadge";
import Spinner from "../components/ui/Spinner";
import { formatDate, truncateText, formatConfidence } from "../utils/helpers";

const FILTERS = [
  { label: "All",         value: "all" },
  { label: "😊 Positive", value: "Positive" },
  { label: "😞 Negative", value: "Negative" },
  { label: "😐 Neutral",  value: "Neutral" },
];

export default function HistoryPage() {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sentiment, setSentiment] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await historyAPI.get({
        sentiment: sentiment === "all" ? undefined : sentiment,
        search: search || undefined,
        page,
        limit: 15,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      setData(res.data as HistoryResponse);
    } catch { toast.error("Failed to load history"); }
    finally { setLoading(false); }
  }, [sentiment, search, page, dateFrom, dateTo]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await fetchHistory();
    })();
    return () => { mounted = false; };
  }, [fetchHistory]);


  const handleDelete = async (id: string) => {
    setDeleting(id);
    try { await historyAPI.delete(id); toast.success("Deleted"); fetchHistory(); }
    catch { toast.error("Delete failed"); }
    finally { setDeleting(null); }
  };

  const handleExport = async () => {
    try {
      const res = await historyAPI.exportCsv();
      const blob = new Blob([res.data as BlobPart], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "sentiment_history.csv"; a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported!");
    } catch { toast.error("Export failed"); }
  };

  const clearDates = () => { setDateFrom(""); setDateTo(""); setPage(1); };

  const inputStyle = { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "8px 12px 8px 36px", color: "var(--color-text)", outline: "none", fontSize: 13, width: "100%" };
  const dateInputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "6px 10px", color: "var(--color-text)", outline: "none", fontSize: 12 };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Analysis History</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>{data?.total ?? 0} total analyses</p>
        </div>
        <button onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", color: "var(--color-primary)" }}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
            <input type="text" placeholder="Search texts…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={inputStyle} />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter size={13} style={{ color: "var(--color-text-muted)" }} />
            <div className="flex gap-1">
              {FILTERS.map(f => (
                <button key={f.value} onClick={() => { setSentiment(f.value); setPage(1); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={sentiment === f.value ? { background: "var(--color-primary)", color: "#fff" } : { background: "var(--color-surface)", color: "var(--color-text-muted)" }}>
                  {f.label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowDateFilter(s => !s)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={showDateFilter || dateFrom || dateTo ? { background: "rgba(124,58,237,0.15)", color: "var(--color-primary)", border: "1px solid rgba(124,58,237,0.3)" } : { background: "var(--color-surface)", color: "var(--color-text-muted)" }}>
              <Calendar size={12} /> Date
            </button>
          </div>
        </div>

        {showDateFilter && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>From</span>
              <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} style={dateInputStyle} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>To</span>
              <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} style={dateInputStyle} />
            </div>
            {(dateFrom || dateTo) && (
              <button onClick={clearDates} className="text-xs px-2.5 py-1 rounded-lg transition-all"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size={28} /></div>
        ) : !data?.items.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
            <span className="text-3xl">📭</span>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No history found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Text", "Sentiment", "Confidence", "Model", "Date", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map((item: HistoryItem) => (
                <tr key={item.id} className="transition-colors hover:bg-white/[0.02]" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td className="px-4 py-3 text-sm max-w-xs" style={{ color: "rgba(255,255,255,0.8)" }}>
                    <span title={item.text}>{truncateText(item.text, 70)}</span>
                  </td>
                  <td className="px-4 py-3"><SentimentBadge sentiment={item.sentiment as SentimentLabel} size="sm" /></td>
                  <td className="px-4 py-3 text-sm font-mono" style={{ color: "var(--color-text-muted)" }}>{formatConfidence(item.confidence)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-md font-mono"
                      style={{ background: "rgba(124,58,237,0.1)", color: "var(--color-primary)", border: "1px solid rgba(124,58,237,0.2)" }}>
                      {item.model_used ?? "vader"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "var(--color-text-muted)" }}>{formatDate(item.created_at)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id}
                      className="p-1.5 rounded-md transition-all disabled:opacity-40 hover:text-red-400"
                      style={{ color: "var(--color-text-muted)" }}>
                      {deleting === item.id ? <Spinner size={13} /> : <Trash2 size={13} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Page {data.page} of {data.pages}</p>
          <div className="flex gap-1.5">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 rounded-lg transition-all disabled:opacity-40"
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
              className="p-2 rounded-lg transition-all disabled:opacity-40"
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
