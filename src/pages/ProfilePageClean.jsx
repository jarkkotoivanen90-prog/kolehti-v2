import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { haptic } from "../lib/effects";
import { xpEvent } from "../lib/xp";
import AdaptiveBackground, { CITY_BACKGROUND_OPTIONS } from "../components/AdaptiveBackground";

const BG = "https://commons.wikimedia.org/wiki/Special:FilePath/Muuratj%C3%A4rvi_Lake_and_Forest%2C_Finland%2C_August_2013.JPG?width=1200";

const panel = "relative overflow-hidden rounded-[34px] border border-cyan-200/20 bg-[#041226]/78 p-5 text-white shadow-2xl shadow-cyan-500/10";
const miniPanel = "relative overflow-hidden rounded-[34px] border border-cyan-200/30 bg-gradient-to-br from-[#0ea5ff]/30 via-[#0ea5ff]/20 to-[#020617]/60 p-4 text-white shadow-[0_0_35px_rgba(14,165,255,.35),inset_0_1px_0_rgba(255,255,255,.10)] backdrop-blur-[10px]";
const innerPanel = "relative overflow-hidden rounded-[24px] border border-cyan-200/30 bg-gradient-to-br from-[#0ea5ff]/30 via-[#0ea5ff]/20 to-[#020617]/60 shadow-[0_0_35px_rgba(14,165,255,.35),inset_0_1px_0_rgba(255,255,255,.10)] backdrop-blur-[10px]";

function GlassGlow() {
  return <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,.14),transparent_45%)]" />;
}

export default function ProfilePageClean() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [xp] = useState(320);
  const [cityPref, setCityPref] = useState("");
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);

  useEffect(() => {
    try {
      setCityPref(localStorage.getItem("kolehti_preferred_city") || "auto");
    } catch {}
  }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    setUser(user);
    const { data } = await supabase.from("posts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(12);
    setPosts(data || []);
  }

  const level = Math.max(1, Math.floor(xp / 100));
  const progress = xp % 100;
  const visiblePosts = useMemo(() => posts.slice(0, 6), [posts]);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#050816] text-white">
      <AdaptiveBackground src={BG} strength="balanced" />

      <main className="relative z-10 mx-auto max-w-md px-4 pb-[170px] pt-6">
        <header className="pb-1">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100/62">Oma taso</p>
          <h1 className="mt-2 text-[48px] font-black leading-none tracking-tight text-glass">Profiili</h1>
          <p className="mt-2 truncate text-sm font-bold text-white/62">{user?.email}</p>
        </header>

        {/* XP PANEL */}
        <section className={`${panel} mt-6`}>
          <GlassGlow />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100/62">Oma XP-taso</p>
              <div className="mt-2 text-[58px] font-black leading-none text-white text-glass">{xp}</div>
              <p className="mt-1 text-sm font-black text-white/66">Level {level} · {progress}% seuraavaan</p>
            </div>
            <div className="grid h-20 w-20 place-items-center rounded-[28px] border border-cyan-100/10 bg-cyan-300/10 text-4xl">⚡</div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => xpEvent("like", null, 10)} className="px-3 py-2 rounded bg-cyan-500 text-xs font-bold">
              +10 XP
            </button>

            <button onClick={() => xpEvent("comment", null, 20)} className="px-3 py-2 rounded bg-blue-500 text-xs font-bold">
              +20 XP
            </button>

            <button onClick={() => xpEvent("share", null, 40)} className="px-3 py-2 rounded bg-purple-500 text-xs font-bold">
              +40 XP
            </button>

            <button
              onClick={() => {
                xpEvent("combo", null, 15);
                setTimeout(() => xpEvent("combo", null, 15), 200);
                setTimeout(() => xpEvent("combo", null, 15), 400);
              }}
              className="px-3 py-2 rounded bg-yellow-400 text-black text-xs font-bold"
            >
              COMBO 🔥
            </button>
          </div>

          <div className="relative mt-5 overflow-hidden rounded-full bg-black/45 p-1">
            <div className="h-5 rounded-full bg-gradient-to-r from-cyan-200 via-sky-400 to-blue-600" style={{ width: `${progress}%` }} />
          </div>
        </section>

        {/* POSTIT */}
        <section className={`${panel} mt-4`}>
          <GlassGlow />
          <div className="relative">
            <h2 className="text-2xl font-black text-glass">Omat postaukset</h2>
            <div className="mt-4 space-y-3">
              {visiblePosts.length ? visiblePosts.map((p) => (
                <div key={p.id} className={`${innerPanel} p-4`}>
                  <p className="text-sm font-bold text-white/82">{p.content}</p>
                </div>
              )) : (
                <div className={`${innerPanel} p-5 text-center`}>
                  <div className="text-4xl">✨</div>
                  <p className="mt-2 font-black text-white/75">Ei vielä postauksia</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
