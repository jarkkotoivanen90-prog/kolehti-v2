import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import AppBottomNav from "../components/AppBottomNav";
import { haptic } from "../lib/effects";

const BG = "https://commons.wikimedia.org/wiki/Special:FilePath/Muuratj%C3%A4rvi_Lake_and_Forest%2C_Finland%2C_August_2013.JPG?width=1200";

export default function ProfilePageClean() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [xp] = useState(320);
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);

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
      <img src={BG} alt="" className="fixed inset-0 h-full w-full object-cover" loading="eager" decoding="async" />
      <div className="fixed inset-0 bg-gradient-to-b from-black/35 via-[#061126]/72 to-black/94" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,.18),transparent_36%)]" />

      <main className="relative z-10 mx-auto max-w-md px-4 pb-[170px] pt-6">
        <header>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200/78">🇫🇮 Suomi · oma taso</p>
          <h1 className="mt-2 text-[44px] font-black leading-none tracking-tight">Profiili</h1>
          <p className="mt-2 truncate text-sm font-bold text-white/58">{user?.email}</p>
        </header>

        <section className="mt-6 rounded-[34px] border border-white/15 bg-black/42 p-5 shadow-2xl shadow-black/35 backdrop-blur-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-cyan-200">Oma XP-taso</p>
              <div className="mt-2 text-[54px] font-black leading-none text-white">{xp}</div>
              <p className="mt-1 text-sm font-black text-white/62">Level {level} · {progress}% seuraavaan</p>
            </div>
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-[28px] border border-cyan-200/20 bg-cyan-500/16 text-4xl shadow-xl shadow-cyan-400/15">⚡</div>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-black/45">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3">
          <StatCard label="Postaukset" value={posts.length} icon="📝" />
          <StatCard label="Status" value="Aktiivinen" icon="🔥" />
        </section>

        <section className="mt-4 rounded-[34px] border border-white/15 bg-black/42 p-5 shadow-2xl shadow-black/30 backdrop-blur-2xl">
          <p className="text-sm font-black uppercase tracking-wide text-cyan-200">Asetukset</p>
          <div className="mt-4 space-y-3">
            <button data-haptic="success" onClick={() => haptic("success")} className="w-full rounded-[24px] border border-white/12 bg-black/36 px-4 py-4 text-left font-black text-white shadow-xl active:scale-[0.98]">⚙️ Sovelluksen asetukset</button>
            <button data-haptic="success" onClick={() => haptic("success")} className="w-full rounded-[24px] border border-white/12 bg-black/36 px-4 py-4 text-left font-black text-white shadow-xl active:scale-[0.98]">🎨 Muokkaa profiilin ulkoasua</button>
          </div>
        </section>

        <section className="mt-4 rounded-[34px] border border-white/15 bg-black/42 p-5 shadow-2xl shadow-black/30 backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-black">Omat postaukset</h2>
            <span className="rounded-full bg-cyan-300/14 px-3 py-1 text-[10px] font-black uppercase text-cyan-100">{visiblePosts.length}</span>
          </div>
          <div className="mt-4 space-y-3">
            {visiblePosts.length ? visiblePosts.map((p) => (
              <div key={p.id} className="rounded-[24px] border border-white/10 bg-black/34 p-4 shadow-xl shadow-black/20">
                <p className="line-clamp-4 text-sm font-bold leading-relaxed text-white/82">{p.content}</p>
              </div>
            )) : (
              <div className="rounded-[24px] border border-white/10 bg-black/34 p-5 text-center">
                <div className="text-4xl">✨</div>
                <p className="mt-2 font-black text-white/75">Ei vielä postauksia</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <AppBottomNav />
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-[28px] border border-white/15 bg-black/42 p-4 shadow-xl shadow-black/25 backdrop-blur-2xl">
      <div className="text-3xl">{icon}</div>
      <div className="mt-3 text-xs font-black uppercase tracking-wide text-white/55">{label}</div>
      <div className="mt-1 truncate text-2xl font-black text-white">{value}</div>
    </div>
  );
}
