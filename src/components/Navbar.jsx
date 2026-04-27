import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Navbar() {
  const [open, setOpen] = useState(false);
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

  async function logout() {
    await supabase.auth.signOut();
    localStorage.removeItem("kolehti_group_id");
    navigate("/login");
  }

  function isActive(path) {
    return location.pathname === path;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/85 text-white backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500 text-xl shadow-lg">
            💙
          </div>

          <div>
            <div className="text-lg font-black leading-none">KOLEHTI</div>
            <div className="text-xs text-white/50">Porukka pitää huolta</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-2xl px-4 py-2 text-sm font-bold transition ${
                isActive(link.to)
                  ? "bg-cyan-500 text-white"
                  : "border border-white/10 bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <button
            onClick={logout}
            className="rounded-2xl bg-pink-500 px-4 py-2 text-sm font-bold text-white"
          >
            Ulos
          </button>
        </nav>

        <button
          onClick={() => setOpen(!open)}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-2xl font-black md:hidden"
          aria-label="Avaa valikko"
        >
          {open ? "×" : "☰"}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-slate-950/95 px-4 pb-4 md:hidden">
          <div className="mx-auto grid max-w-6xl gap-2 pt-3">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  isActive(link.to)
                    ? "bg-cyan-500 text-white"
                    : "border border-white/10 bg-white/10 text-white/80"
                }`}
              >
                {link.label}
              </Link>
            ))}

            <button
              onClick={logout}
              className="rounded-2xl bg-pink-500 px-4 py-3 text-left text-sm font-bold text-white"
            >
              Kirjaudu ulos
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
