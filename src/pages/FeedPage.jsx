import { useFeed } from "../hooks/useFeed";
import { useProfile } from "../hooks/useProfile";
import { useVote } from "../hooks/useVote";
import { useBoost } from "../hooks/useBoost";
import FeedCard from "../components/feed/FeedCard";
import SectionHeader from "../components/ui/SectionHeader";

export default function FeedPage({ notifications }) {
  const { entries, reload } = useFeed("day");
  const profile = useProfile();
  const { vote } = useVote();
  const { boost } = useBoost();

  async function onVote(postId) {
    try {
      await vote(postId, "day");
      notifications.success("Ääni tallennettu");
      reload();
    } catch (e) {
      notifications.error(e.message);
    }
  }

  async function onBoost(postId) {
    try {
      await boost(postId);
      notifications.success("Boost tallennettu");
      reload();
    } catch (e) {
      notifications.error(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <section className="glass-card p-5">
        <SectionHeader eyebrow="Feed" title="Perustelut" subtitle="Näe yhteisön vahvimmat perustelut ja AI:n nostamat signaalit." />
      </section>
      <div className="grid gap-4">
        {entries.map((entry) => (
          <FeedCard key={entry.id} entry={entry} onVote={onVote} mine={profile?.id === entry.profile_id} onBoost={onBoost} />
        ))}
        {!entries.length ? <div className="glass-card p-6 text-white/70">Ei aktiivisia perusteluja.</div> : null}
      </div>
    </div>
  );
}
