export default function GlassCard({ children, className = "", style = {} }) {
  return (
    <div
      className={`
        relative
        overflow-hidden
        rounded-[32px]
        border border-white/20
        bg-white/10
        shadow-[0_20px_60px_rgba(0,0,0,0.25)]
        backdrop-blur-[30px]
        ${className}
      `}
      style={{
        backdropFilter: "blur(30px) saturate(180%)",
        WebkitBackdropFilter: "blur(30px) saturate(180%)",
        ...style,
      }}
    >
      {/* highlight layer */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-white/10 opacity-60" />

      {/* content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
