const ROUTE_BACKGROUNDS = {
  "/pots": "https://commons.wikimedia.org/wiki/Special:FilePath/Ikaalinen_-_lake_and_forest.jpg?width=1400",
  "/profile": "https://commons.wikimedia.org/wiki/Special:FilePath/Muuratj%C3%A4rvi_Lake_and_Forest%2C_Finland%2C_August_2013.JPG?width=1400",
  "/new": "https://commons.wikimedia.org/wiki/Special:FilePath/Frozen_lake_in_Finland.jpg?width=1400",
  "/groups": "https://commons.wikimedia.org/wiki/Special:FilePath/Finnish_lake_and_forest_landscape_(175928795).jpg?width=1400",
  "/growth": "https://commons.wikimedia.org/wiki/Special:FilePath/Aurora_borealis_over_Lapland.jpg?width=1400",
  "/leaderboard": "https://commons.wikimedia.org/wiki/Special:FilePath/Saana_fell_from_Kilpisj%C3%A4rvi.jpg?width=1400",
  "/war": "https://commons.wikimedia.org/wiki/Special:FilePath/Repovesi_National_Park_Kuutinkanava.jpg?width=1400",
};

function getRouteBackground(fallback) {
  try {
    const path = window.location.pathname;
    return ROUTE_BACKGROUNDS[path] || fallback;
  } catch {
    return fallback;
  }
}

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
  const resolvedSrc = getRouteBackground(src);

  return (
    <>
      <img src={resolvedSrc} alt={alt} className={`fixed inset-0 h-full w-full object-cover ${mode.image}`} loading="eager" decoding="async" />
      <div className={`fixed inset-0 bg-gradient-to-b ${mode.gradient}`} />
      <div className={`fixed inset-0 ${mode.veil}`} />
      <div className="fixed inset-0" style={{ background: `radial-gradient(circle at top, ${mode.glow}, transparent 40%)` }} />
    </>
  );
}
