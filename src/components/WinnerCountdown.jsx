import { useEffect, useState } from "react";
import { getTimeUntilMidnight } from "../lib/countdown";

export default function WinnerCountdown() {
  const [time, setTime] = useState(getTimeUntilMidnight());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(getTimeUntilMidnight());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="rounded-[34px] border border-cyan-300/20 bg-cyan-500/10 p-5 shadow-2xl">
      <div className="text-xs font-black uppercase tracking-wide text-cyan-200">
        ⏳ Seuraava voittaja
      </div>

      <h2 className="mt-2 text-4xl font-black text-white">{time.label}</h2>

      <p className="mt-2 text-sm font-bold text-white/60">
        Päivän voittaja lukitaan vuorokauden lopussa.
      </p>
    </section>
  );
}
