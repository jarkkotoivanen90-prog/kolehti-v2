import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function KHeartgramLogo({ compact = false }) {
  return (
    <div className={`relative grid shrink-0 place-items-center ${compact ? "h-11 w-11" : "h-14 w-14"}`}>
      <div className="absolute inset-0 rounded-[22px] bg-gradient-to-br from-cyan-200 via-white to-blue-700 shadow-[0_0_28px_rgba(34,211,238,.35)]" />
      <div className="absolute inset-[4px] rounded-[18px] border border-white/35 bg-[#061126]/35" />
      <div className="absolute left-1/2 top-[7px] h-[calc(100%-14px)] w-[3px] -translate-x-1/2 rounded-full bg-white/70" />
      <div className="absolute left-[7px] top-1/2 h-[3px] w-[calc(100%-14px)] -translate-y-1/2 rounded-full bg-white/45" />
      <svg viewBox="0 0 120 120" className="relative h-[72%] w-[72%] drop-shadow-[0_0_14px_rgba(255,255,255,.55)]">
        <path d="M60 103C48 89 12 72 12 45c0-14 10-24 23-24 11 0 19 7 25 17 6-10 14-17 25-17 13 0 23 10 23 24 0 27-36 44-48 58Z" fill="white" opacity=".96" />
        <path d="M35 30h17v28l29-28h23L74 60l34 38H82L52 63v35H35V30Z" fill="#061126" />
        <path d="M51 31v27l28-27h14L65 59l31 38H82L51 62v35h-9V31h9Z" fill="url(#kGradNav)" />
        <defs>
          <linearGradient id="kGradNav" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e0fbff" />
            <stop offset="55%" stopColor="#67e8f9" />
            <stop offset="100%" stopColor="#fef3c7" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-4 border-[#061126] bg-yellow-300 text-[12px] font-black text-black">✓</div>
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
            <div className="mt-1 flex flex-wrap gap-1.5 text-[9px] font-black uppercase tracking-[0.14em]">
              <span className="rounded-full bg-cyan-300/15 px-2 py-1 text-cyan-100">🇫🇮 Suomi</span>
              <span className="rounded-full bg-white/10 px-2 py-1 text-white/75">Porukka</span>
              <span className="rounded-full bg-yellow-300/15 px-2 py-1 text-yellow-100">Potti</span>
            </div>
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
