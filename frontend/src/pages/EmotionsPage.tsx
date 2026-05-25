import { useEffect, useState } from "react";
import { HeartPulse } from "lucide-react";
import toast from "react-hot-toast";
import Spinner from "../components/ui/Spinner";
import EmotionBadges from "../components/insights/EmotionBadges";
import { emotionsAPI } from "../api/client";

type EmotionDist = Partial<Record<"happy" | "sad" | "angry" | "excited", number>>;

type EmotionsResponse = {
  distribution?: EmotionDist;
  [k: string]: unknown;
};

const cardStyle: React.CSSProperties = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  padding: 20,
};

export default function EmotionsPage() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [distribution, setDistribution] = useState<EmotionDist>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await emotionsAPI.get(days);
        const data = res.data as EmotionsResponse;
        if (!mounted) return;
        setDistribution((data.distribution ?? {}) as EmotionDist);
      } catch {
        toast.error("Failed to load emotions");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [days]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <HeartPulse size={20} /> Emotions
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Emotion detection results (Happy / Sad / Angry / Excited)
          </p>
        </div>

        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium"
              style={
                days === d
                  ? { background: "var(--color-primary)", color: "#fff" }
                  : { background: "rgba(255,255,255,0.06)", color: "var(--color-text-muted)" }
              }
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={cardStyle} className="flex items-center justify-center h-64">
          <Spinner size={32} />
        </div>
      ) : (
        <div style={cardStyle}>
          <h2 className="text-sm font-semibold text-white mb-3">Emotion Distribution</h2>
          <EmotionBadges distribution={distribution} />

          <div className="mt-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
            Values represent distribution returned by <code>/emotions</code>.
          </div>
        </div>
      )}
    </div>
  );
}

