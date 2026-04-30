import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import AppBottomNav from "../components/AppBottomNav";
import { haptic } from "../lib/effects";

const BG = "https://commons.wikimedia.org/wiki/Special:FilePath/Muuratj%C3%A4rvi_Lake_and_Forest%2C_Finland%2C_August_2013.JPG?width=1200";

const panel = "premium-card rounded-[34px] p-5";
const miniPanel = "premium-card rounded-[28px] p-4";
const innerPanel = "rounded-[24px] border border-cyan-100/10 bg-[#030816]/58 shadow-[inset_0_1px_0_rgba(255,255,255,.06)]";

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
      <div className="fixed inset-0 bg-gradient-to-b from-black/42 via-[#061126]/76 to-black/95" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(21,131,255,.13),transparent_34%)]" />

      <main className="relative z-10 mx-auto max-w-md px-4 pb-[170px] pt-6">
        <header className="pb-1">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100/62">Oma taso</p>
          <h1 className="mt-2 text-[48px] font-black leading-none tracking-tight">Profiili</h1>
          <p className="mt-2 truncate text-sm font-bold text-white/62">{user?.email}</p>
        </header>

        <section className={`${panel} mt-6`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-cyan-200">Oma XP-taso</p>
              <div className="mt-2 text-[58px] font-black leading-none text-white">{xp}</div>
              <p className="mt-1 text-sm font-black text-white/66">Level {level} · {progress}% seuraavaan</p>
            </div>
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-[28px] border border-cyan-100/14 bg-[#071a3f]/72 text-4xl shadow-[0_0_24px_rgba(21,131,255,.16)]">⚡</div>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-black/48">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-200 via-sky-400 to-blue-600 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3">
          <StatCard label="Postaukset" value={posts.length} icon="📝" />
          <StatCard label="Status" value="Aktiivinen" icon="🔥" />
        </section>

        <section className={`${panel} mt-4`}>
          <p className="text-sm font-black uppercase tracking-wide text-cyan-200">Asetukset</p>
          <div className="mt-4 space-y-3">
            <button data-haptic="success" onClick={() => haptic("success")} className={`${innerPanel} w-full px-4 py-4 text-left font-black text-white active:scale-[0.98]`}>⚙️ Sovelluksen asetukset</button>
            <button data-haptic="success" onClick={() => haptic("success")} className={`${innerPanel} w-full px-4 py-4 text-left font-black text-white active:scale-[0.98]`}>🎨 Muokkaa profiilin ulkoasua</button>
          </div>
        </section>

        <section className={`${panel} mt-4`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-black">Omat postaukset</h2>
            <span className="rounded-full border border-cyan-100/12 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase text-cyan-100">{visiblePosts.length}</span>
          </div>
          <div className="mt-4 space-y-3">
            {visiblePosts.length ? visiblePosts.map((p) => (
              <div key={p.id} className={`${innerPanel} p-4`}>
                <p className="line-clamp-4 text-sm font-bold leading-relaxed text-white/82">{p.content}</p>
              </div>
            )) : (
              <div className={`${innerPanel} p-5 text-center`}>
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
    <div className={miniPanel}>
      <div className="text-3xl">{icon}</div>
      <div className="mt-3 text-xs font-black uppercase tracking-wide text-white/55">{label}</div>
      <div className="mt-1 truncate text-2xl font-black text-white">{value}</div>
    </div>
  );
}
