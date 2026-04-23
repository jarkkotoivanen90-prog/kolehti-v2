import SectionHeader from "../components/ui/SectionHeader";
import SwipeVotingView from "../components/swipe/SwipeVotingView";
import { useFeed } from "../hooks/useFeed";

export default function VotePage({ notifications }) {
  const { entries, optimisticVote } = useFeed("day");

  return (
    <div className="space-y-6">
      <section className="glass-card p-5">
        <SectionHeader eyebrow="Swipe voting" title="Äänestä nopeasti" subtitle="Vedä oikealle äänestääksesi, vasemmalle ohittaaksesi." />
      </section>
      <section className="glass-card p-5">
        <SwipeVotingView
          entries={entries}
          drawType="day"
          onOptimisticVote={optimisticVote}
          onVoteSuccess={(entry) => notifications.success(`${entry.display_name || "Käyttäjä"} sai uuden äänen`)}
          onVoteError={(e) => notifications.error(e.message || "Äänestys epäonnistui")}
        />
      </section>
    </div>
  );
}
