import { useState } from "react";
import { motion } from "framer-motion";
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

const links = [
  { to: "/", label: "Etusivu" },
  { to: "/feed", label: "Feed" },
  { to: "/new", label: "Uusi" },
  { to: "/groups", label: "Porukat" },
  { to: "/pots", label: "Potit" },
  { to: "/leaderboard", label: "Top-lista" },
  { to: "/profile", label: "Profiili" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  async function logout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  function isActive(path) {
    return location.pathname === path;
  }

  return (
    <header className="fixed top-4 left-0 right-0 z-50 px-3">
      <div className="mx-auto flex max-w-md justify-end">
        <button onClick={() => setOpen(!open)} className="h-11 w-11 rounded-full bg-white/10 text-white">☰</button>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-2 max-w-md rounded-[28px] border border-white/12 bg-[#020611]/76 px-3 pb-3 shadow-2xl backdrop-blur-xl md:backdrop-blur-2xl will-change-transform"
        >
          <div className="grid gap-2 pt-3">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={`rounded-2xl px-4 py-3 text-sm font-black transition-all duration-200 ease-out active:scale-[0.97] ${isActive(link.to) ? "bg-cyan-300 text-[#061126] shadow-[0_0_18px_rgba(34,211,238,0.35)]" : "border border-white/10 bg-white/[.065] text-white/80 active:shadow-lg active:shadow-cyan-300/20"}`}
              >
                {link.label}
              </Link>
            ))}
            <button onClick={logout} className="rounded-2xl bg-pink-500/85 px-4 py-3 text-sm font-black text-white active:scale-[0.97]">
              Kirjaudu ulos
            </button>
          </div>
        </motion.div>
      )}
    </header>
  );
}
