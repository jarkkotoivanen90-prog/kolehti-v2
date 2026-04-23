import PremiumButton from "../ui/PremiumButton";

export default function FeedCard({ entry, onVote, mine = false, onBoost }) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-white/60">{entry.display_name || "Käyttäjä"} • {entry.trust_level || "new"}</div>
          <div className="mt-1 text-lg font-bold">{entry.title || "Perustelu"}</div>
        </div>
        {entry.feed_rank ? <div className="pill">#{entry.feed_rank}</div> : null}
      </div>
      <div className="mt-3 text-white/85">{entry.text || entry.body}</div>
      {entry.reason_summary ? <div className="mt-2 text-xs text-emerald-200/80">{entry.reason_summary}</div> : null}
      {entry.feed_explanation ? <div className="mt-2 text-xs text-cyan-200/80">AI feed: {entry.feed_explanation}</div> : null}
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/65">
        <div className="pill">❤️ {entry.votes || 0}</div>
        <div className="pill">AI {Number(entry.ai_score || 0).toFixed(2)}</div>
        <div className="pill">Hook {Number(entry.hook_score || 0).toFixed(2)}</div>
        <div className="pill">Audience {Number(entry.audience_fit_score || 0).toFixed(2)}</div>
      </div>
      <div className="mt-4 flex gap-3">
        <PremiumButton variant="success" onClick={() => onVote?.(entry.id)}>Äänestä</PremiumButton>
        {mine ? <PremiumButton variant="gold" onClick={() => onBoost?.(entry.id)}>Boostaa</PremiumButton> : null}
      </div>
    </div>
  );
}
