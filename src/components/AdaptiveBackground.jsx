const ROUTE_BACKGROUNDS = {
  "/pots": {
    src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=92",
    position: "center",
    vibe: "rgba(34,211,238,.10)",
  },
  "/profile": {
    src: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1800&q=92",
    position: "center top",
    vibe: "rgba(96,165,250,.12)",
  },
  "/new": {
    src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1800&q=92",
    position: "center",
    vibe: "rgba(125,211,252,.14)",
  },
  "/groups": {
    src: "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1800&q=92",
    position: "center",
    vibe: "rgba(45,212,191,.12)",
  },
  "/growth": {
    src: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1800&q=92",
    position: "center top",
    vibe: "rgba(168,85,247,.14)",
  },
  "/leaderboard": {
    src: "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=1800&q=92",
    position: "center",
    vibe: "rgba(59,130,246,.12)",
  },
  "/war": {
    src: "https://images.unsplash.com/photo-1477346611705-65d1883cee1e?auto=format&fit=crop&w=1800&q=92",
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
