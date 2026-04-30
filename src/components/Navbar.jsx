import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const BUILD_MARKER = "BUILD 2026-04-30-BUST-2";

function KHeartgramLogo({ compact = false }) {
  return (
    <div className={`relative grid shrink-0 place-items-center ${compact ? "h-11 w-11" : "h-14 w-14"}`}>
      <div className="absolute inset-0 rounded-[22px] bg-gradient-to-br from-cyan-200 via-blue-400 to-blue-800 shadow-[0_0_28px_rgba(34,211,238,.35)]" />
      <div className="absolute inset-[4px] rounded-[18px] border border-white/35 bg-[#061126]/25" />
      <svg viewBox="0 0 120 120" className="relative h-[72%] w-[72%] drop-shadow-[0_0_14px_rgba(255,255,255,.55)]">
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

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    { to: "/", label: "Koti" },
    { to: "/feed", label: "Feed" },
    { to: "/pots", label: "Potit" },
    { to: "/new", label: "Uusi" },
    { to: "/groups", label: "Porukat" },
    { to: "/profile", label: "Profiili" },
  ];

  useEffect(() => {
    let lastY = 0;
    function readScrollY() {
      const feedScroller = document.getElementById("feed-scroll-root");
      return feedScroller ? feedScroller.scrollTop : window.scrollY;
    }
    function update() {
      const y = readScrollY();
      const goingDown = y > lastY;
      setHidden(location.pathname === "/feed" && goingDown && y > 90 && !open);
      lastY = Math.max(0, y);
    }
    const feedScroller = document.getElementById("feed-scroll-root");
    const target = feedScroller || window;
    target.addEventListener("scroll", update, { passive: true });
    window.addEventListener("touchmove", update, { passive: true });
    return () => {
      target.removeEventListener("scroll", update);
      window.removeEventListener("touchmove", update);
    };
  }, [location.pathname, open]);

  useEffect(() => {
    setHidden(false);
    setOpen(false);
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
    <header className={`sticky top-0 z-50 border-b border-cyan-200/10 bg-[#071124]/92 text-white shadow-lg shadow-black/25 backdrop-blur-2xl transition-transform duration-300 ease-out ${hidden ? "-translate-y-[92%]" : "translate-y-0"}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
          <KHeartgramLogo />
          <div className="min-w-0">
            <div className="truncate bg-gradient-to-r from-cyan-100 via-white to-yellow-100 bg-clip-text text-2xl font-black leading-none tracking-tight text-transparent">KOLEHTI</div>
            <div className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100/85">Äänestä · Nosta · Voita</div>
            <div className="mt-1 text-[8px] font-black uppercase tracking-wide text-white/28">{BUILD_MARKER}</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className={`rounded-2xl px-4 py-2 text-sm font-black transition ${isActive(link.to) ? "bg-cyan-400 text-[#061126] shadow-lg shadow-cyan-400/20" : "border border-white/10 bg-white/8 text-white/78 hover:bg-white/15"}`}>{link.label}</Link>
          ))}
          <button onClick={logout} className="rounded-2xl bg-pink-500 px-4 py-2 text-sm font-black text-white shadow-lg shadow-pink-500/20">Ulos</button>
        </nav>

        <button onClick={() => setOpen(!open)} className="grid h-14 w-14 place-items-center rounded-[24px] border border-white/10 bg-white/10 text-3xl font-black shadow-xl shadow-black/20 md:hidden" aria-label="Avaa valikko">
          {open ? "×" : "☰"}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-[#071124]/98 px-4 pb-4 md:hidden">
          <div className="mx-auto grid max-w-6xl gap-2 pt-3">
            {links.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setOpen(false)} className={`rounded-2xl px-4 py-3 text-sm font-black transition ${isActive(link.to) ? "bg-cyan-400 text-[#061126]" : "border border-white/10 bg-white/10 text-white/80"}`}>{link.label}</Link>
            ))}
            <button onClick={logout} className="rounded-2xl bg-pink-500 px-4 py-3 text-left text-sm font-black text-white">Kirjaudu ulos</button>
          </div>
        </div>
      )}
    </header>
  );
}
