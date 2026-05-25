interface WordCloudProps {
  words: Array<{ text: string; value: number }>;
  sentiment?: "positive" | "negative" | "neutral";
  width?: number;
  height?: number;
}

const COLORS = {
  positive: ["#10b981", "#059669", "#34d399"],
  negative: ["#ef4444", "#dc2626", "#f87171"],
  neutral:  ["#f59e0b", "#d97706", "#fbbf24"],
};

export default function WordCloud({ words, sentiment = "neutral" }: WordCloudProps) {
  if (!words.length) return null;
  const max = words[0]?.value ?? 1;
  const colors = COLORS[sentiment];
  return (
    <div className="flex flex-wrap gap-2 justify-center p-3">
      {words.map((w, i) => {
        const size = 11 + Math.round((w.value / max) * 18);
        const color = colors[i % colors.length];
        return (
          <span key={i} className="font-medium cursor-default hover:opacity-80 transition-opacity"
            style={{ fontSize: size, color, opacity: 0.55 + (w.value / max) * 0.45 }}>
            {w.text}
          </span>
        );
      })}
    </div>
  );
}
