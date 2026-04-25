import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    { to: "/", label: "Koti" },
    { to: "/feed", label: "Feed" },
    { to: "/new", label: "Uusi" },
    { to: "/groups", label: "Porukat" },
    { to: "/profile", label: "Profiili" },
  ];

  async function logout() {
    await supabase.auth.signOut();
    localStorage.removeItem("kolehti_group_id");
    navigate("/login");
  }

  return (
    <div className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 text-white">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500 text-xl">
            💙
          </div>

          <div>
            <div className="text-lg font-black leading-none">KOLEHTI</div>
            <div className="text-xs text-white/50">Porukka pitää huolta</div>
          </div>
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {links.map((link) => {
            const active = location.pathname === link.to;

            return (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-2xl px-3 py-2 text-sm font-bold transition ${
                  active
                    ? "bg-cyan-500 text-white"
                    : "border border-white/10 bg-white/10 text-white/80 hover:bg-white/20"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          <button
            onClick={logout}
            className="rounded-2xl bg-pink-500 px-3 py-2 text-sm font-bold text-white"
          >
            Ulos
          </button>
        </div>
      </div>
    </div>
  );
}
