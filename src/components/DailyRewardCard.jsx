import { useState } from "react";
import { claimDailyReward } from "../lib/rewards";

export default function DailyRewardCard({ user, onClaim }) {
  const [loading, setLoading] = useState(false);

  async function claim() {
    if (!user?.id) return;

    setLoading(true);
    const result = await claimDailyReward(user.id);
    setLoading(false);

    if (result?.claimed) {
      onClaim?.(result);
    } else {
      alert(result?.message || "Palkinto on jo haettu.");
    }
  }

  return (
    <section className="rounded-[34px] border border-yellow-300/25 bg-yellow-500/10 p-5 shadow-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-wide text-yellow-200">
            Päivän palkinto
          </div>

          <h2 className="mt-1 text-3xl font-black">🎁 +20 XP</h2>

          <p className="mt-2 text-sm font-bold text-white/60">
            Avaa appi päivittäin ja kerää tasoja nopeammin.
          </p>
        </div>

        <button
          onClick={claim}
          disabled={loading}
          className="rounded-2xl bg-yellow-400 px-5 py-4 text-sm font-black text-black disabled:opacity-50"
        >
          {loading ? "Haetaan..." : "Hae"}
        </button>
      </div>
    </section>
  );
}
