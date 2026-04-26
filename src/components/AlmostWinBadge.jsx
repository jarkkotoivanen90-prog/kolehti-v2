import { getAlmostWinText } from "../lib/almostWin";

export default function AlmostWinBadge({ rankInfo }) {
  if (!rankInfo) return null;

  return (
    <div
      className={`mt-4 rounded-2xl border p-3 text-sm font-black ${
        rankInfo.isTop3
          ? "border-yellow-300/30 bg-yellow-500/15 text-yellow-100"
          : "border-cyan-300/30 bg-cyan-500/10 text-cyan-100"
      }`}
    >
      {getAlmostWinText(rankInfo)}
    </div>
  );
}
