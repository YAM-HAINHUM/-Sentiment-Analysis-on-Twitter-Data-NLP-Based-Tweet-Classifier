export default function AlertBanner({
  show,
  message,
}: {
  show: boolean;
  message: string;
}) {
  if (!show) return null;

  return (
    <div
      role="alert"
      className="mx-auto max-w-6xl px-4 sm:px-6"
      style={{ marginBottom: 16 }}
    >
      <div
        className="flex items-start gap-3 rounded-xl"
        style={{
          background: "rgba(239,68,68,0.12)",
          border: "1px solid rgba(239,68,68,0.35)",
          color: "var(--color-text)",
          padding: "12px 14px",
        }}
      >
        <div className="text-lg leading-none">⚠️</div>
        <div className="text-sm" style={{ color: "#fecaca" }}>
          {message}
        </div>
      </div>
    </div>
  );
}

