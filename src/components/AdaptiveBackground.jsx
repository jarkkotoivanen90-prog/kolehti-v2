const FINLAND_BACKGROUNDS = {
  lakeForest: "https://commons.wikimedia.org/wiki/Special:FilePath/Muuratj%C3%A4rvi_Lake_and_Forest%2C_Finland%2C_August_2013.JPG?width=1600",
  ikaalinenLake: "https://commons.wikimedia.org/wiki/Special:FilePath/Ikaalinen_-_lake_and_forest.jpg?width=1600",
  rukaAurora: "https://commons.wikimedia.org/wiki/Special:FilePath/Northern_Lights_%2824798830390%29.jpg?width=1600",
  rukaAuroraWide: "https://commons.wikimedia.org/wiki/Special:FilePath/Northern_Lights_%2840234785864%29.jpg?width=1600",
  helsinkiAurora: "https://commons.wikimedia.org/wiki/Special:FilePath/Northern_Lights_%288566030147%29.jpg?width=1600",
};

const ROUTE_BACKGROUNDS = {
  "/login": {
    src: FINLAND_BACKGROUNDS.helsinkiAurora,
    position: "center",
    vibe: "rgba(34,211,238,.12)",
  },
  "/reset": {
    src: FINLAND_BACKGROUNDS.rukaAurora,
    position: "center",
    vibe: "rgba(96,165,250,.14)",
  },
  "/pots": {
    src: FINLAND_BACKGROUNDS.ikaalinenLake,
    position: "center",
    vibe: "rgba(34,211,238,.10)",
  },
  "/profile": {
    src: FINLAND_BACKGROUNDS.lakeForest,
    position: "center",
    vibe: "rgba(96,165,250,.12)",
  },
  "/new": {
    src: FINLAND_BACKGROUNDS.ikaalinenLake,
    position: "center",
    vibe: "rgba(125,211,252,.14)",
  },
  "/groups": {
    src: FINLAND_BACKGROUNDS.lakeForest,
    position: "center",
    vibe: "rgba(45,212,191,.12)",
  },
  "/growth": {
    src: FINLAND_BACKGROUNDS.rukaAuroraWide,
    position: "center",
    vibe: "rgba(168,85,247,.14)",
  },
  "/leaderboard": {
    src: FINLAND_BACKGROUNDS.helsinkiAurora,
    position: "center",
    vibe: "rgba(59,130,246,.12)",
  },
  "/war": {
    src: FINLAND_BACKGROUNDS.rukaAurora,
    position: "center",
    vibe: "rgba(14,165,233,.12)",
  },
};

function getRouteConfig(fallback) {
  try {
    const path = window.location.pathname;
    return ROUTE_BACKGROUNDS[path] || { src: fallback || FINLAND_BACKGROUNDS.lakeForest, position: "center", vibe: "rgba(34,211,238,.10)" };
  } catch {
    return { src: fallback || FINLAND_BACKGROUNDS.lakeForest, position: "center", vibe: "rgba(34,211,238,.10)" };
  }
}

export default function AdaptiveBackground({ src, alt = "", strength = "balanced" }) {
  const modes = {
    soft: {
      image: "brightness-[0.86] saturate-[1.08] contrast-[1.04]",
      gradient: "from-black/42 via-[#061126]/68 to-black/94",
      veil: "bg-black/6",
    },
    balanced: {
      image: "brightness-[0.76] saturate-[1.10] contrast-[1.06]",
      gradient: "from-black/52 via-[#061126]/76 to-black/96",
      veil: "bg-black/10",
    },
    strong: {
      image: "brightness-[0.62] saturate-[1.02] contrast-[1.02]",
      gradient: "from-black/66 via-[#020617]/88 to-black",
      veil: "bg-black/20 backdrop-blur-[1px]",
    },
  };

  const mode = modes[strength] || modes.balanced;
  const route = getRouteConfig(src);

  return (
    <>
      <style>{`
        @keyframes kolehtiBgFloat {
          0% { transform: scale(1.045) translate3d(-0.7%, -0.4%, 0); }
          50% { transform: scale(1.085) translate3d(0.7%, 0.45%, 0); }
          100% { transform: scale(1.045) translate3d(-0.7%, -0.4%, 0); }
        }
        @keyframes kolehtiLightDrift {
          0% { opacity: .55; transform: translate3d(-3%, -1%, 0) scale(1); }
          50% { opacity: .9; transform: translate3d(3%, 1%, 0) scale(1.08); }
          100% { opacity: .55; transform: translate3d(-3%, -1%, 0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .kolehti-bg-float, .kolehti-light-drift { animation: none !important; }
        }
      `}</style>
      <img
        src={route.src}
        alt={alt}
        className={`kolehti-bg-float fixed inset-0 h-full w-full object-cover ${mode.image}`}
        style={{ objectPosition: route.position, animation: "kolehtiBgFloat 24s ease-in-out infinite", willChange: "transform" }}
        loading="eager"
        decoding="async"
      />
      <div className={`fixed inset-0 bg-gradient-to-b ${mode.gradient}`} />
      <div className={`fixed inset-0 ${mode.veil}`} />
      <div className="kolehti-light-drift fixed inset-0" style={{ background: `radial-gradient(circle at 50% 0%, ${route.vibe}, transparent 38%)`, animation: "kolehtiLightDrift 9s ease-in-out infinite", willChange: "transform, opacity" }} />
      <div className="fixed inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,.18)_76%,rgba(0,0,0,.42)_100%)]" />
    </>
  );
}
