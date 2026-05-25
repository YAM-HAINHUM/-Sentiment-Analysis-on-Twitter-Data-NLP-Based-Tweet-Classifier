import { type SentimentLabel } from "../../types";
import { SENTIMENT_COLORS } from "../../utils/helpers";

interface Props {
  sentiment: SentimentLabel;
  size?: "sm" | "md";
}

const EMOJI: Record<SentimentLabel, string> = {
  Positive: "😊",
  Negative: "😞",
  Neutral: "😐",
};

export default function SentimentBadge({ sentiment, size = "md" }: Props) {
  const color = SENTIMENT_COLORS[sentiment];
  const isSmall = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full border ${
        isSmall ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1"
      }`}
      style={{
        color,
        background: `${color}1a`,
        borderColor: `${color}33`,
      }}
    >
      <span>{EMOJI[sentiment]}</span>
      <span>{sentiment}</span>
    </span>
  );
}
