import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function KHeartgramLogo({ compact = false }) {
  return (
    <div className={`relative grid shrink-0 place-items-center ${compact ? "h-10 w-10" : "h-11 w-11"}`}>
      <div className="absolute inset-0 rounded-[20px] bg-gradient-to-br from-cyan-100 via-blue-400 to-blue-900 shadow-[0_0_22px_rgba(34,211,238,.34)]" />
      <div className="absolute inset-[4px] rounded-[16px] border border-white/35 bg-[#061126]/22 backdrop-blur" />
      <svg viewBox="0 0 120 120" className="relative h-[72%] w-[72%] drop-shadow-[0_0_10px_rgba(255,255,255,.45)]">
        <defs>
          <linearGradient id="heartBlueNav" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e0fbff" />
            <stop offset="42%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
        <path d="M60 103C48 89 12 72 12 45c0-14 10-24 23-24 11 0 19 7 25 17 6-10 14-17 25-17 13 0 23 10 23 24 0 27-36 44-48 58Z" fill="url(#heartBlueNav)" opacity=".98" />
        <path d="M35 30h17v28l29-28h23L74 60l34 38H82L52 63v35H35V30Z" fill="white" />
        <rect x="40" y="31" width="10" height="66" rx="4" fill="#0ea5e9" />
      </svg>
    </div>
  );
}

function pageMeta(pathname) {
  if (pathname === "/feed") return { title: "Feed", sub: "AI valitsee seuraavan", glow: "rgba(59,130,246,.20)", href: "/feed" };
  if (pathname === "/pots") return { title: "Potit", sub: "Live · päivä · viikko", glow: "rgba(250,204,21,.16)", href: "/pots" };
  if (pathname === "/new") return { title: "Uusi", sub: "Kirjoita vahva entry", glow: "rgba(34,211,238,.22)", href: "/new" };
  if (pathname === "/groups") return { title: "Porukat", sub: "Yhteisö · ranking", glow: "rgba(45,212,191,.18)", href: "/groups" };
  if (pathname === "/profile") return { title: "Profiili", sub: "XP · status · omat", glow: "rgba(96,165,250,.18)", href: "/profile" };
  if (pathname === "/growth") return { title: "Kasvu", sub: "Loopit · streakit", glow: "rgba(168,85,247,.20)", href: "/growth" };
  if (pathname === "/leaderboard") return { title: "Top-lista", sub: "Top tekijät", glow: "rgba(59,130,246,.18)", href: "/leaderboard" };
  if (pathname === "/war") return { title: "Battle", sub: "Rival battle", glow: "rgba(250,204,21,.18)", href: "/war" };
  return { title: "KOLEHTI", sub: "Live · AI · Potit", glow: "rgba(139,238,255,.18)", href: "/feed" };
}

const links = [
  { to: "/", label: "Etusivu" },
  { to: "/feed", label: "Feed" },
  { to: "/new", label: "Uusi" },
  { to: "/groups", label: "Porukat" },
  { to: "/pots", label: "Potit" },
  { to: "/leaderboard", label: "Top-lista" },
  { to: "/growth", label: "Kasvu" },
  { to: "/war", label: "Battle" },
  { to: "/profile", label: "Profiili" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [compact, setCompact] = useState(false);
  const [magnet, setMagnet] = useState({ x: 0, y: 0 });
  const location = useLocation();
  const navigate = useNavigate();
  const lastY = useRef(0);
  const meta = useMemo(() => pageMeta(location.pathname), [location.pathname]);

  useEffect(() => {
    let ticking = false;
    function readScrollY() {
      const feedScroller = document.getElementById("feed-scroll-root");
      return feedScroller ? feedScroller.scrollTop : window.scrollY;
    }
    function update() {
      ticking = false;
      const y = readScrollY();
      const delta = y - lastY.current;
      setCompact(y > 22);
      document.documentElement.style.setProperty("--kolehti-header-offset", y > 22 ? "92px" : "118px");
      if (!open) {
        if (delta > 8 && y > 70) setHidden(true);
        if (delta < -7 || y < 36) setHidden(false);
      }
      lastY.current = Math.max(0, y);
    }
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }
    function onTouchMove(e) {
      const y = e.touches?.[0]?.clientY || 0;
      if (y < 86) setHidden(false);
      onScroll();
    }
    function onPointerMove(e) {
      if (e.clientY < 105) {
        const pullX = Math.max(-8, Math.min(8, (e.clientX - window.innerWidth / 2) / 28));
        const pullY = Math.max(-2, Math.min(5, (e.clientY - 56) / 20));
        setMagnet({ x: pullX, y: pullY });
        setHidden(false);
      } else if (magnet.x || magnet.y) {
        setMagnet({ x: 0, y: 0 });
      }
    }
    const feedScroller = document.getElementById("feed-scroll-root");
    const target = feedScroller || window;
    target.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    update();
    return () => {
      target.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [location.pathname, open, magnet.x, magnet.y]);

  useEffect(() => {
    setHidden(false);
    setOpen(false);
    setCompact(false);
    setMagnet({ x: 0, y: 0 });
    lastY.current = 0;
    document.body.dataset.kolehtiRoute = location.pathname.replace(/^\//, "") || "home";
    document.documentElement.style.setProperty("--kolehti-header-offset", "118px");
    return () => {
      document.body.dataset.kolehtiRoute = "";
      document.documentElement.style.removeProperty("--kolehti-header-offset");
    };
  }, [location.pathname]);

  async function logout() {
    await supabase.auth.signOut();
    localStorage.removeItem("kolehti_group_id");
    navigate("/login");
  }

  function isActive(path) {
    return location.pathname === path;
  }

  return (
    <header className={`pointer-events-none fixed left-0 right-0 top-[max(10px,env(safe-area-inset-top))] z-50 px-3 text-white transition-all duration-500 ease-[cubic-bezier(.2,.9,.2,1)] ${hidden ? "-translate-y-[125%] opacity-0" : "translate-y-0 opacity-100"}`}>
      <div
        className={`pointer-events-auto mx-auto flex max-w-md items-center justify-between gap-3 overflow-hidden border border-white/12 bg-[#020611]/24 shadow-2xl shadow-black/24 backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(.2,.9,.2,1)] ${compact ? "rounded-full px-2.5 py-1.5" : "rounded-[30px] px-3 py-2"}`}
        style={{ transform: `translate3d(${magnet.x}px, ${magnet.y}px, 0)` }}
      >
        <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(circle at 18% 0%, ${meta.glow}, transparent 46%)` }} />
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/55 to-transparent" />

        <Link to={meta.href} className="relative flex min-w-0 items-center gap-2" onClick={() => setOpen(false)}>
          <KHeartgramLogo compact />
          <div className="min-w-0">
            <div className="truncate bg-gradient-to-r from-cyan-100 via-white to-cyan-100 bg-clip-text text-lg font-black leading-none tracking-tight text-transparent">{meta.title}</div>
            {!compact && <div className="mt-0.5 truncate text-[9px] font-black uppercase tracking-[0.20em] text-cyan-100/62">{meta.sub}</div>}
          </div>
        </Link>

        <nav className="relative hidden items-center gap-1 md:flex">
          {links.slice(1, 6).map((link) => (
            <Link key={link.to} to={link.to} className={`rounded-2xl px-3 py-2 text-xs font-black transition ${isActive(link.to) ? "bg-cyan-300/90 text-[#061126] shadow-lg shadow-cyan-300/20" : "border border-white/8 bg-white/[.055] text-white/72 hover:bg-white/12"}`}>{link.label}</Link>
          ))}
          <button onClick={logout} className="rounded-2xl bg-pink-500/80 px-3 py-2 text-xs font-black text-white shadow-lg shadow-pink-500/15">Ulos</button>
        </nav>

        <button onClick={() => setOpen(!open)} className="relative grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[.075] text-2xl font-black shadow-lg shadow-black/18 md:hidden" aria-label="Avaa valikko">
          {open ? "×" : "☰"}
        </button>
      </div>

      {open && (
        <div className="pointer-events-auto mx-auto mt-2 max-h-[76dvh] max-w-md overflow-y-auto rounded-[28px] border border-white/12 bg-[#020611]/72 px-3 pb-3 shadow-2xl shadow-black/30 backdrop-blur-2xl [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
          <div className="grid gap-2 pt-3">
            {links.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setOpen(false)} className={`rounded-2xl px-4 py-3 text-sm font-black transition ${isActive(link.to) ? "bg-cyan-300 text-[#061126]" : "border border-white/10 bg-white/[.065] text-white/80"}`}>{link.label}</Link>
            ))}
            <button onClick={logout} className="rounded-2xl bg-pink-500/85 px-4 py-3 text-left text-sm font-black text-white">Kirjaudu ulos</button>
          </div>
        </div>
      )}
    </header>
  );
}
