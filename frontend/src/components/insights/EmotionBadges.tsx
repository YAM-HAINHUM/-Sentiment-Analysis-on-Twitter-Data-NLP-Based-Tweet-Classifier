import type { CSSProperties } from "react";


export type EmotionLabel = "happy" | "sad" | "angry" | "excited";

const EMOTION_META: Record<EmotionLabel, { label: string; color: string; bg: string; border: string }> = {
  happy: {
    label: "Happy",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.12)",
    border: "rgba(34,197,94,0.35)",
  },
  sad: {
    label: "Sad",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.12)",
    border: "rgba(96,165,250,0.35)",
  },
  angry: {
    label: "Angry",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.35)",
  },
  excited: {
    label: "Excited",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.35)",
  },
};

export default function EmotionBadges({
  distribution,
}: {
  distribution: Partial<Record<EmotionLabel, number>>;
}) {
  const entries = (Object.keys(EMOTION_META) as EmotionLabel[]).map((k) => ({
    key: k,
    value: distribution[k] ?? 0,
  }));

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(({ key, value }) => {
        const meta = EMOTION_META[key];
        const style: CSSProperties = {
          color: meta.color,
          background: meta.bg,
          border: `1px solid ${meta.border}`,
        };
        return (
          <span
            key={key}
            className="text-xs px-3 py-1 rounded-full font-medium"
            style={style}
            title={`${meta.label}: ${value}%`}
          >
            {meta.label} {typeof value === "number" ? `${value}%` : "—"}
          </span>
        );
      })}
    </div>
  );
}

