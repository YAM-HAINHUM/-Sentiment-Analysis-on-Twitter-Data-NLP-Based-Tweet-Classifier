import { type SentimentLabel } from "../../types";
import { SENTIMENT_COLORS } from "../../utils/helpers";

interface Props {
  value: number; // 0..1
  sentiment: SentimentLabel;
  label?: string;
}

export default function ConfidenceBar({ value, sentiment, label }: Props) {
  const color = SENTIMENT_COLORS[sentiment];
  const pct = Math.round(value * 100);

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs text-[var(--color-text-muted)] mb-1">
          <span>{label}</span>
          <span style={{ color }} className="font-semibold">
            {pct}%
          </span>
        </div>
      )}
      <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
