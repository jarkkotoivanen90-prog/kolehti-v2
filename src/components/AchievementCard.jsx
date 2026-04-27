import { ACHIEVEMENTS } from "../lib/achievements";

export default function AchievementCard({ profile }) {
  const unlocked = profile?.achievements || [];
  const unlockedIds = unlocked.map((a) => a.id);

  return (
    <section className="rounded-[34px] border border-purple-300/20 bg-purple-500/10 p-5 shadow-2xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-wide text-purple-200">
            Saavutukset
          </div>
          <h2 className="mt-1 text-2xl font-black">
            {profile?.active_badge || "🌱 Aloittaja"}
          </h2>
        </div>

        <div className="rounded-2xl bg-black/30 px-4 py-2 text-sm font-black text-purple-100">
          {profile?.achievement_score || 0} pts
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {ACHIEVEMENTS.map((item) => {
          const isUnlocked = unlockedIds.includes(item.id);

          return (
            <div
              key={item.id}
              className={`rounded-3xl border p-4 ${
                isUnlocked
                  ? "border-purple-300/30 bg-white/10"
                  : "border-white/5 bg-black/20 opacity-45"
              }`}
            >
              <div className="text-4xl">{item.icon}</div>
              <div className="mt-2 text-sm font-black">{item.title}</div>
              <p className="mt-1 text-xs font-bold text-white/55">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
