import { useState } from "react";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import toast from "react-hot-toast";
import Spinner from "../components/ui/Spinner";
import { exportAPI, historyAPI } from "../api/client";

const cardStyle: React.CSSProperties = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  padding: 20,
};

export default function SavedReportsPage() {
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingCsv, setLoadingCsv] = useState(false);

  const handlePdf = async () => {
    setLoadingPdf(true);
    try {
      const res = await exportAPI.pdfReport("Sentiment Analytics Report");
      const blob = new Blob([res.data as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sentiment_report.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch {
      toast.error("PDF download failed");
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleCsv = async () => {
    setLoadingCsv(true);
    try {
      const res = await historyAPI.exportCsv();
      const blob = new Blob([res.data as BlobPart], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sentiment_history.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
    } catch {
      toast.error("CSV download failed");
    } finally {
      setLoadingCsv(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Saved Reports</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Download reports (PDF/CSV)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div style={cardStyle} className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText size={18} style={{ color: "var(--color-primary)" }} />
            <h2 className="text-sm font-semibold text-white">PDF Report</h2>
          </div>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Exports sentiment analytics as a PDF.
          </p>
          <button
            onClick={handlePdf}
            disabled={loadingPdf}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)", color: "var(--color-primary)" }}
          >
            {loadingPdf ? <Spinner size={14} /> : <Download size={16} />} 
            {loadingPdf ? "Generating…" : "Download PDF"}
          </button>
        </div>

        <div style={cardStyle} className="space-y-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={18} style={{ color: "var(--color-primary)" }} />
            <h2 className="text-sm font-semibold text-white">CSV History</h2>
          </div>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Downloads the saved sentiment history as CSV.
          </p>
          <button
            onClick={handleCsv}
            disabled={loadingCsv}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.25)", color: "#22d3ee" }}
          >
            {loadingCsv ? <Spinner size={14} /> : <Download size={16} />} 
            {loadingCsv ? "Preparing…" : "Download CSV"}
          </button>
        </div>
      </div>
    </div>
  );
}

