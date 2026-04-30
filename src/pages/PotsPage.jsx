import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import AppBottomNav from "../components/AppBottomNav";
import { haptic } from "../lib/effects";

const BG = "https://commons.wikimedia.org/wiki/Special:FilePath/Ikaalinen_-_lake_and_forest.jpg?width=1200";

export default function PotsPage() {
  const [amount, setAmount] = useState(120);
  const [players, setPlayers] = useState(12);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAmount((v) => v + Math.floor(Math.random() * 3));
      setPlayers((v) => v + (Math.random() > 0.7 ? 1 : 0));
      setPulse((v) => v + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#050816] text-white">
      <img src={BG} alt="" className="fixed inset-0 h-full w-full object-cover" loading="eager" decoding="async" />
      <div className="fixed inset-0 bg-gradient-to-b from-black/35 via-[#061126]/72 to-black/94" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(250,204,21,.18),transparent_36%)]" />

      <main className="relative z-10 mx-auto max-w-md px-4 pb-[170px] pt-6">
        <header className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-200">💰 Suomi · potit</p>
          <h1 className="mt-2 text-[54px] font-black leading-none tracking-tight text-white">Potit</h1>
        </header>

        <section className="mt-6 rounded-[38px] border border-yellow-300/25 bg-black/42 p-6 shadow-2xl shadow-yellow-300/20 backdrop-blur-2xl text-center">
          <p className="text-xs font-black uppercase text-yellow-200">Päivän potti</p>
          <div key={pulse} className="mt-2 text-[68px] font-black text-yellow-300">€{amount}</div>
          <p className="mt-2 text-sm font-bold text-white/60">{players} pelaajaa mukana</p>
        </section>

        <section className="mt-4 rounded-[34px] border border-white/15 bg-black/42 p-5 shadow-2xl backdrop-blur-2xl">
          <p className="text-sm font-black text-cyan-200">🔥 Kilpailu elää</p>
          <p className="mt-2 text-sm font-bold text-white/70">Jokainen ääni kasvattaa pottia ja muuttaa tilannetta.</p>
        </section>

        <div className="mt-4 flex gap-3">
          <Link to="/new" className="flex-1 rounded-[26px] bg-cyan-500 px-4 py-4 text-center font-black">Luo postaus</Link>
          <Link to="/feed" className="flex-1 rounded-[26px] bg-yellow-300 px-4 py-4 text-center font-black text-black">Feed</Link>
        </div>
      </main>

      <AppBottomNav />
    </div>
  );
}
