import { useEffect, useState } from "react";
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

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
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
      setHidden(goingDown && y > 70 && !open);
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
    <header className={`pointer-events-none fixed left-0 right-0 top-[max(10px,env(safe-area-inset-top))] z-50 px-3 text-white transition-all duration-500 ease-[cubic-bezier(.2,.9,.2,1)] ${hidden ? "-translate-y-[120%] opacity-0" : "translate-y-0 opacity-100"}`}>
      <div className="pointer-events-auto mx-auto flex max-w-md items-center justify-between gap-3 rounded-full border border-white/12 bg-[#020611]/28 px-3 py-2 shadow-2xl shadow-black/28 backdrop-blur-2xl">
        <Link to="/feed" className="flex min-w-0 items-center gap-2" onClick={() => setOpen(false)}>
          <KHeartgramLogo compact />
          <div className="min-w-0">
            <div className="truncate bg-gradient-to-r from-cyan-100 via-white to-cyan-100 bg-clip-text text-lg font-black leading-none tracking-tight text-transparent">KOLEHTI</div>
            <div className="mt-0.5 text-[9px] font-black uppercase tracking-[0.20em] text-cyan-100/62">Live · AI · Potit</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className={`rounded-2xl px-3 py-2 text-xs font-black transition ${isActive(link.to) ? "bg-cyan-300/90 text-[#061126] shadow-lg shadow-cyan-300/20" : "border border-white/8 bg-white/[.055] text-white/72 hover:bg-white/12"}`}>{link.label}</Link>
          ))}
          <button onClick={logout} className="rounded-2xl bg-pink-500/80 px-3 py-2 text-xs font-black text-white shadow-lg shadow-pink-500/15">Ulos</button>
        </nav>

        <button onClick={() => setOpen(!open)} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[.075] text-2xl font-black shadow-lg shadow-black/18 md:hidden" aria-label="Avaa valikko">
          {open ? "×" : "☰"}
        </button>
      </div>

      {open && (
        <div className="pointer-events-auto mx-auto mt-2 max-w-md overflow-hidden rounded-[28px] border border-white/12 bg-[#020611]/72 px-3 pb-3 shadow-2xl shadow-black/30 backdrop-blur-2xl md:hidden">
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
