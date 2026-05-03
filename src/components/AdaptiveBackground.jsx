import { useEffect, useMemo, useState } from "react";

const COMMONS = "https://commons.wikimedia.org/wiki/Special:FilePath/";

function commonsFile(name) {
  return `${COMMONS}${encodeURIComponent(name)}?width=1600`;
}

export const CITY_BACKGROUND_OPTIONS = [
  { key: "auto", label: "Automaattinen" },
  { key: "joensuu", label: "Joensuu" },
  { key: "helsinki", label: "Helsinki" },
  { key: "tampere", label: "Tampere" },
  { key: "turku", label: "Turku" },
  { key: "oulu", label: "Oulu" },
  { key: "kuopio", label: "Kuopio" },
];

const CITY_ALIASES = {
  joensuu: "joensuu",
  helsinki: "helsinki",
  tampere: "tampere",
  turku: "turku",
  oulu: "oulu",
  kuopio: "kuopio",
};

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
    sea: { src: commonsFile("Helsinki Skyline (52432702085).jpg"), position: "center" },
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

function normalizeCityName(value) {
  return String(value || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

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

async function reverseGeocodeCity(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=10&addressdetails=1`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) return null;
  const data = await response.json();
  const address = data?.address || {};
  return address.city || address.town || address.municipality || address.village || address.county || null;
}

function readSavedCity() {
  try {
    return localStorage.getItem("kolehti_city_background") || "helsinki";
  } catch {
    return "helsinki";
  }
}

function readPreferredCity() {
  try {
    const value = localStorage.getItem("kolehti_preferred_city");
    return value && CITY_BACKGROUND_SETS[value] ? value : null;
  } catch {
    return null;
  }
}

function saveCity(value) {
  try { localStorage.setItem("kolehti_city_background", value); } catch {}
}

function getSessionSeed() {
  try {
    const key = "kolehti_city_bg_session_seed";
    const saved = sessionStorage.getItem(key);
    if (saved && Number.isFinite(Number(saved))) return Number(saved);
    const next = Math.floor(Math.random() * 1000);
    sessionStorage.setItem(key, String(next));
    return next;
  } catch {
    return Math.floor(Math.random() * 1000);
  }
}

function getRouteConfig(cityKey, fallback, seed, path) {
  try {
    const citySet = CITY_BACKGROUND_SETS[cityKey] || CITY_BACKGROUND_SETS.helsinki;
    const images = Object.values(citySet);
    const routeIndex = ROUTE_IMAGE_KEYS[path] ?? 0;
    const selectedIndex = (routeIndex + seed) % images.length;
    const selected = images[selectedIndex] || images[0];
    const next = images[(selectedIndex + 1) % images.length] || images[0];
    return {
      ...selected,
      src: selected.src || fallback || CITY_BACKGROUND_SETS.helsinki.skyline.src,
      preload: next.src,
      vibe: cityKey === "turku" ? "rgba(45,212,191,.12)" : cityKey === "tampere" ? "rgba(96,165,250,.13)" : cityKey === "joensuu" ? "rgba(34,211,238,.11)" : "rgba(59,130,246,.12)",
    };
  } catch {
    return { src: fallback || CITY_BACKGROUND_SETS.helsinki.skyline.src, preload: CITY_BACKGROUND_SETS.helsinki.city.src, position: "center", vibe: "rgba(34,211,238,.10)" };
  }
}

export default function AdaptiveBackground({ src, alt = "", strength = "balanced" }) {
  const [cityKey, setCityKey] = useState(() => readPreferredCity() || readSavedCity());
  const [seed] = useState(getSessionSeed);
  const [loadedSrc, setLoadedSrc] = useState("");
  const path = typeof window !== "undefined" ? window.location.pathname : "/";

  useEffect(() => {
    const preferred = readPreferredCity();
    if (preferred) {
      setCityKey(preferred);
      saveCity(preferred);
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const nearest = nearestSupportedCity(latitude, longitude);
        let nextCity = nearest;

        try {
          const cityName = await reverseGeocodeCity(latitude, longitude);
          const exact = CITY_ALIASES[normalizeCityName(cityName)];
          if (exact && CITY_BACKGROUND_SETS[exact]) nextCity = exact;
        } catch {}

        setCityKey(nextCity);
        saveCity(nextCity);
      },
      () => {},
      { enableHighAccuracy: false, maximumAge: 1000 * 60 * 60 * 24, timeout: 4500 }
    );
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const offset = Math.min(14, Math.max(-14, window.scrollY * 0.028));
        document.documentElement.style.setProperty("--kolehti-bg-offset", `${offset}px`);
        ticking = false;
      });
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const modes = {
    soft: {
      image: "brightness-[0.84] saturate-[1.08] contrast-[1.04]",
      gradient: "from-black/46 via-[#061126]/70 to-black/94",
      veil: "bg-black/8",
    },
    balanced: {
      image: "brightness-[0.70] saturate-[1.10] contrast-[1.08]",
      gradient: "from-black/58 via-[#061126]/78 to-black/97",
      veil: "bg-black/12",
    },
    strong: {
      image: "brightness-[0.60] saturate-[1.04] contrast-[1.05]",
      gradient: "from-black/68 via-[#020617]/88 to-black",
      veil: "bg-black/22 backdrop-blur-[1px]",
    },
  };

  const mode = modes[strength] || modes.balanced;
  const route = useMemo(() => getRouteConfig(cityKey, src, seed, path), [cityKey, src, seed, path]);
  const visible = loadedSrc === route.src;

  useEffect(() => {
    if (!route.preload || typeof Image === "undefined") return;
    const image = new Image();
    image.decoding = "async";
    image.loading = "lazy";
    image.src = route.preload;
  }, [route.preload]);

  return (
    <>
      <style>{`
        @keyframes kolehtiBgFloat {
          0% { transform: translateY(var(--kolehti-bg-offset, 0px)) scale(1.06) translate3d(-0.35%, -0.2%, 0); }
          50% { transform: translateY(var(--kolehti-bg-offset, 0px)) scale(1.08) translate3d(0.35%, 0.2%, 0); }
          100% { transform: translateY(var(--kolehti-bg-offset, 0px)) scale(1.06) translate3d(-0.35%, -0.2%, 0); }
        }
        @keyframes kolehtiLightDrift {
          0% { opacity: .48; transform: translate3d(-2%, -1%, 0) scale(1); }
          50% { opacity: .78; transform: translate3d(2%, 1%, 0) scale(1.06); }
          100% { opacity: .48; transform: translate3d(-2%, -1%, 0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .kolehti-bg-float, .kolehti-light-drift { animation: none !important; transition: none !important; }
        }
      `}</style>
      <img
        key={route.src}
        src={route.src}
        alt={alt}
        className={`kolehti-bg-float fixed inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 ease-out ${visible ? "opacity-100" : ""} ${mode.image}`}
        style={{ objectPosition: route.position, animation: "kolehtiBgFloat 30s ease-in-out infinite", willChange: "transform, opacity" }}
        loading="eager"
        decoding="async"
        onLoad={() => setLoadedSrc(route.src)}
      />
      <div className={`fixed inset-0 bg-gradient-to-b ${mode.gradient}`} />
      <div className={`fixed inset-0 ${mode.veil}`} />
      <div className="fixed inset-x-0 top-0 h-44 bg-gradient-to-b from-black/70 via-black/28 to-transparent" />
      <div className="kolehti-light-drift fixed inset-0" style={{ background: `radial-gradient(circle at 50% 0%, ${route.vibe}, transparent 38%)`, animation: "kolehtiLightDrift 12s ease-in-out infinite", willChange: "transform, opacity" }} />
      <div className="fixed inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/78 via-black/22 to-transparent" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,.20)_74%,rgba(0,0,0,.46)_100%)]" />
    </>
  );
}
