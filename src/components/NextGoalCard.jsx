export default function NextGoalCard({ profile }) {
  return (
    <section className="rounded-[34px] border border-cyan-300/20 bg-cyan-500/10 p-5 shadow-2xl">
      <div className="text-xs font-black uppercase tracking-wide text-cyan-200">
        Seuraava tavoite
      </div>

      <h2 className="mt-2 text-2xl font-black">
        🎯 {profile?.next_goal || "Tee ensimmäinen perustelu"}
      </h2>

      <p className="mt-2 text-sm font-bold text-white/60">
        Jokainen teko nostaa profiiliasi, näkyvyyttäsi ja mahdollisuuttasi päästä kärkeen.
      </p>
    </section>
  );
}
