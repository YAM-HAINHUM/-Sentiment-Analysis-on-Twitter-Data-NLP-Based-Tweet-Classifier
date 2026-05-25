export default function Spinner({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      className={`inline-block rounded-full animate-spin ${className}`}
      style={{ width: size, height: size, border: "2px solid rgba(255,255,255,0.15)", borderTopColor: "var(--color-primary)" }}
    />
  );
}
