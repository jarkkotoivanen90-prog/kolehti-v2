export default function ProfileCard({ profile }) {
  if (!profile) return null;
  const score = Number(profile.reputation_score || 0.5);
  return (
    <div className="glass-card p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-2xl font-black">{profile.display_name || "Käyttäjä"}</div>
          <div className="mt-1 text-sm text-white/65">Taso: {profile.trust_level || "new"}</div>
          <div className="mt-2 text-sm text-white/70">DNA: {profile.player_dna || "Ei vielä analysoitu"}</div>
          <div className="text-xs text-white/55">Tyyli: {profile.persuasion_style || "Odottamassa analyysiä"}</div>
        </div>
        <div className="min-w-[220px]">
          <div className="w-full rounded-full bg-white/10 h-3">
            <div className="h-3 rounded-full bg-gradient-to-r from-cyan-300 to-emerald-400" style={{ width: `${score * 100}%` }} />
          </div>
          <div className="mt-2 text-sm text-white/65">Maine {score.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}
