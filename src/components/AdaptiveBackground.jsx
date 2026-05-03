import { useEffect, useMemo, useState } from "react";

const COMMONS = "https://commons.wikimedia.org/wiki/Special:FilePath/";

function commonsFile(name) {
  return `${COMMONS}${encodeURIComponent(name)}?width=1600`;
}

const CITY_BACKGROUND_SETS = {
  joensuu: {
    center: { src: commonsFile("Joensuu city centre.jpg"), position: "center" },
    river: { src: commonsFile("Joensuu Pielisjoki riverside 1.jpg"), position: "center" },
    rooftop: { src: commonsFile("Joensuu rooftop.JPG"), position: "center" },
    siltakatu: { src: commonsFile("Joensuu Siltakatu buildings.jpg"), position: "center" },
    ilosaari: { src: commonsFile("Ilosaari, Joensuu.jpg"), position: "center" },
  },
  helsinki: {
    skyline: { src: commonsFile("Helsinki Skyline (52432702085).jpg"), position: "center" },
    city: { src: commonsFile("City of Helsinki.jpg"), position: "center" },
    jatkasaari: { src: commonsFile("Helsinki skyline from Jätkäsaari.jpg"), position: "center" },
    center: { src: commonsFile("Helsinki City Centre.jpg"), position: "center" },
    night: { src: commonsFile("Helsinki Skyline (52432702085).jpg"), position: "center" },
  },
  tampere: {
    nasinneula: { src: commonsFile("Näsinneula view 18.jpg"), position: "center" },
    tower: { src: commonsFile("Näsinneula tower Tampere 04.jpg"), position: "center" },
    snowy: { src: commonsFile("Snowy Tampere from Näsinneula.jpg"), position: "center" },
    center: { src: commonsFile("Tampere center from Näsinneula.jpg"), position: "center" },
    towerAlt: { src: commonsFile("Näsinneula tower Tampere 03.jpg"), position: "center" },
  },
  turku: {
    aura: { src: commonsFile("Turku - Aurajoki.jpg"), position: "center" },
    auraTwo: { src: commonsFile("Aurajoki, Turku 2.jpg"), position: "center" },
    city: { src: commonsFile("Turku city view.jpg"), position: "center" },
    center: { src: commonsFile("Turku Cathedral and Aura River.jpg"), position: "center" },
    river: { src: commonsFile("Aurajoki Turku.jpg"), position: "center" },
  },
  oulu: {
    center: { src: commonsFile("Oulu city centre 2016.jpg"), position: "center" },
    market: { src: commonsFile("Oulu Market Square 2018.jpg"), position: "center" },
    rotuaari: { src: commonsFile("Rotuaari Oulu.jpg"), position: "center" },
    aerial: { src: commonsFile("Oulu city centre aerial view.jpg"), position: "center" },
    river: { src: commonsFile("Oulu city view.jpg"), position: "center" },
  },
  kuopio: {
    puijo: { src: commonsFile("Kuopio from Puijo Tower.jpg"), position: "center" },
    center: { src: commonsFile("Kuopio city centre.jpg"), position: "center" },
    harbour: { src: commonsFile("Kuopio harbour.jpg"), position: "center" },
    market: { src: commonsFile("Kuopio Market Square.jpg"), position: "center" },
    city: { src: commonsFile("Kuopio city view.jpg"), position: "center" },
  },
};

const CITY_COORDINATES = [
  { key: "joensuu", lat: 62.6010, lon: 29.7636 },
  { key: "helsinki", lat: 60.1699, lon: 24.9384 },
  { key: "tampere", lat: 61.4978, lon: 23.7610 },
  { key: "turku", lat: 60.4518, lon: 22.2666 },
  { key: "oulu", lat: 65.0121, lon: 25.4651 },
  { key: "kuopio", lat: 62.8924, lon: 27.6770 },
];

const ROUTE_IMAGE_KEYS = {
  "/login": 0,
  "/reset": 1,
  "/pots": 2,
  "/profile": 3,
  "/new": 4,
  "/groups": 0,
  "/growth": 1,
  "/leaderboard": 2,
  "/war": 3,
};

function distanceKm(aLat, aLon, bLat, bLon) {
  const radius = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(h));
}

function nearestSupportedCity(lat, lon) {
  return CITY_COORDINATES.reduce((best, city) => {
    const distance = distanceKm(lat, lon, city.lat, city.lon);
    return distance < best.distance ? { key: city.key, distance } : best;
  }, { key: "helsinki", distance: Infinity }).key;
}

function readSavedCity() {
  try {
    return localStorage.getItem("kolehti_city_background") || "helsinki";
  } catch {
    return "helsinki";
  }
}

function getRouteConfig(cityKey, fallback) {
  try {
    const path = window.location.pathname;
    const citySet = CITY_BACKGROUND_SETS[cityKey] || CITY_BACKGROUND_SETS.helsinki;
    const images = Object.values(citySet);
    const routeIndex = ROUTE_IMAGE_KEYS[path] ?? 0;
    const selected = images[routeIndex % images.length] || images[0];
    return {
      ...selected,
      src: selected.src || fallback || CITY_BACKGROUND_SETS.helsinki.skyline.src,
      vibe: cityKey === "turku" ? "rgba(45,212,191,.12)" : cityKey === "tampere" ? "rgba(96,165,250,.13)" : cityKey === "joensuu" ? "rgba(34,211,238,.11)" : "rgba(59,130,246,.12)",
    };
  } catch {
    return { src: fallback || CITY_BACKGROUND_SETS.helsinki.skyline.src, position: "center", vibe: "rgba(34,211,238,.10)" };
  }
}

export default function AdaptiveBackground({ src, alt = "", strength = "balanced" }) {
  const [cityKey, setCityKey] = useState(readSavedCity);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCity = nearestSupportedCity(position.coords.latitude, position.coords.longitude);
        setCityKey(nextCity);
        try { localStorage.setItem("kolehti_city_background", nextCity); } catch {}
      },
      () => {},
      { enableHighAccuracy: false, maximumAge: 1000 * 60 * 60 * 24, timeout: 4500 }
    );
  }, []);

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
  const route = useMemo(() => getRouteConfig(cityKey, src), [cityKey, src]);

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
