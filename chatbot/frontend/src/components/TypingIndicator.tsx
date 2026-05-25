export default function TypingIndicator() {
  return (
    <div className="flex gap-4 px-4 py-3">
      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white">
        AI
      </div>
      <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="typing-dot"
            style={{ animationDelay: `${i * 0.16}s` }}
          />
        ))}
      </div>
    </div>
  );
}
