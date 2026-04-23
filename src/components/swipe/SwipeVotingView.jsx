import { useMemo, useState } from "react";
import SwipeVotingCard from "./SwipeVotingCard";
import PremiumButton from "../ui/PremiumButton";
import { useVote } from "../../hooks/useVote";

export default function SwipeVotingView({ entries = [], drawType = "day", onOptimisticVote, onVoteSuccess, onVoteError }) {
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const { vote } = useVote();
  const current = useMemo(() => entries[index], [entries, index]);

  function next() {
    setIndex((prev) => Math.min(prev + 1, entries.length));
  }

  async function handleVote(entry) {
    if (!entry || busy) return;
    setBusy(true);
    let rollback = null;
    try {
      rollback = onOptimisticVote?.(entry.id, 1);
      next();
      const data = await vote(entry.id, drawType);
      onVoteSuccess?.(entry, data);
    } catch (error) {
      rollback?.();
      onVoteError?.(error);
    } finally {
      setBusy(false);
    }
  }

  if (!current) {
    return <div className="glass-card p-6 text-center">Ei enempää perusteluja juuri nyt.</div>;
  }

  return (
    <div className="space-y-4">
      <SwipeVotingCard entry={current} onVote={handleVote} onSkip={next} />
      <div className="flex justify-center gap-3">
        <PremiumButton variant="ghost" onClick={next}>Ohita</PremiumButton>
        <PremiumButton variant="success" onClick={() => handleVote(current)} disabled={busy}>
          {busy ? "Tallennetaan..." : "Äänestä"}
        </PremiumButton>
      </div>
    </div>
  );
}
