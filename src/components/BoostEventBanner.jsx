import { useEffect, useState } from "react";

function getRemainingLabel(endsAt) {
  if (!endsAt) return "00:00";

  const diff = Math.max(0, new Date(endsAt).getTime() - Date.now());
  const minutes = Math.floor(diff / 1000 / 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

export default function BoostEventBanner({ event }) {
  const [remaining, setRemaining] = useState(getRemainingLabel(event?.ends_at));

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(getRemainingLabel(event?.ends_at));
    }, 1000);

    return () => clearInterval(timer);
  }, [event?.ends_at]);

  if (!event?.posts) return null;

  return (
    <section className="rounded-[34px] border border-pink-300/30 bg-pink-500/10 p-5 shadow-2xl">
      <div className="text-xs font-black uppercase tracking-wide text-pink-200">
        ⚡ Boost Event
      </div>

      <h2 className="mt-2 text-3xl font-black text-pink-100">
        2x näkyvyys · {remaining}
      </h2>

      <p className="mt-3 text-sm font-bold text-white/70">
        Tämä perustelu saa hetkellisesti lisänäkyvyyttä:
      </p>

      <p className="mt-2 line-clamp-2 text-lg font-black text-white">
        {event.posts.content}
      </p>
    </section>
  );
}
