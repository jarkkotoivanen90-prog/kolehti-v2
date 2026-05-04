export default function GlassCard({ children, className = "", padding = "p-4", as: Component = "div" }) {
  return (
    <Component className={`glass-card ${padding} ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,.12),transparent_45%)]" />
      <div className="relative z-10">{children}</div>
    </Component>
  );
}
