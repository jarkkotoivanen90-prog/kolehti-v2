export default function AdaptiveBackground({ src, alt = "", strength = "balanced" }) {
  const modes = {
    soft: {
      image: "brightness-[0.78] saturate-[0.92] contrast-[0.95]",
      gradient: "from-black/50 via-[#061126]/78 to-black/96",
      veil: "bg-black/12 backdrop-blur-[1px]",
      glow: "rgba(34,211,238,.08)",
    },
    balanced: {
      image: "brightness-[0.66] saturate-[0.88] contrast-[0.92]",
      gradient: "from-black/62 via-[#061126]/86 to-black/98",
      veil: "bg-black/20 backdrop-blur-[1.5px]",
      glow: "rgba(34,211,238,.10)",
    },
    strong: {
      image: "brightness-[0.54] saturate-[0.82] contrast-[0.90]",
      gradient: "from-black/72 via-[#020617]/92 to-black",
      veil: "bg-black/28 backdrop-blur-[2px]",
      glow: "rgba(34,211,238,.08)",
    },
  };

  const mode = modes[strength] || modes.balanced;

  return (
    <>
      <img src={src} alt={alt} className={`fixed inset-0 h-full w-full object-cover ${mode.image}`} loading="eager" decoding="async" />
      <div className={`fixed inset-0 bg-gradient-to-b ${mode.gradient}`} />
      <div className={`fixed inset-0 ${mode.veil}`} />
      <div className="fixed inset-0" style={{ background: `radial-gradient(circle at top, ${mode.glow}, transparent 40%)` }} />
    </>
  );
}
