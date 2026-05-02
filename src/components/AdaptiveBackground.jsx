const ROUTE_BACKGROUNDS = {
  "/pots": {
    src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
    position: "center",
    vibe: "rgba(34,211,238,.10)",
  },
  "/profile": {
    src: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1400&q=80",
    position: "center top",
    vibe: "rgba(96,165,250,.12)",
  },
  "/new": {
    src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80",
    position: "center",
    vibe: "rgba(125,211,252,.14)",
  },
  "/groups": {
    src: "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1400&q=80",
    position: "center",
    vibe: "rgba(45,212,191,.12)",
  },
  "/growth": {
    src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1400&q=80",
    position: "center top",
    vibe: "rgba(168,85,247,.14)",
  },
  "/leaderboard": {
    src: "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=1400&q=80",
    position: "center",
    vibe: "rgba(59,130,246,.12)",
  },
  "/war": {
    src: "https://images.unsplash.com/photo-1477346611705-65d1883cee1e?auto=format&fit=crop&w=1400&q=80",
    position: "center",
    vibe: "rgba(14,165,233,.12)",
  },
};

function getRouteConfig(fallback) {
  try {
    const path = window.location.pathname;
    return ROUTE_BACKGROUNDS[path] || { src: fallback, position: "center", vibe: "rgba(34,211,238,.10)" };
  } catch {
    return { src: fallback, position: "center", vibe: "rgba(34,211,238,.10)" };
  }
}

export default function AdaptiveBackground({ src, alt = "", strength = "balanced" }) {
  const modes = {
    soft: {
      image: "brightness-[0.80] saturate-[0.96] contrast-[0.96]",
      gradient: "from-black/50 via-[#061126]/76 to-black/96",
      veil: "bg-black/10 backdrop-blur-[1px]",
    },
    balanced: {
      image: "brightness-[0.62] saturate-[0.94] contrast-[0.94]",
      gradient: "from-black/62 via-[#061126]/84 to-black/98",
      veil: "bg-black/18 backdrop-blur-[1.5px]",
    },
    strong: {
      image: "brightness-[0.50] saturate-[0.88] contrast-[0.92]",
      gradient: "from-black/72 via-[#020617]/92 to-black",
      veil: "bg-black/28 backdrop-blur-[2px]",
    },
  };

  const mode = modes[strength] || modes.balanced;
  const route = getRouteConfig(src);

  return (
    <>
      <img
        src={route.src}
        alt={alt}
        className={`fixed inset-0 h-full w-full object-cover ${mode.image}`}
        style={{ objectPosition: route.position }}
        loading="eager"
        decoding="async"
      />
      <div className={`fixed inset-0 bg-gradient-to-b ${mode.gradient}`} />
      <div className={`fixed inset-0 ${mode.veil}`} />
      <div className="fixed inset-0" style={{ background: `radial-gradient(circle at top, ${route.vibe}, transparent 42%)` }} />
      <div className="fixed inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
    </>
  );
}
