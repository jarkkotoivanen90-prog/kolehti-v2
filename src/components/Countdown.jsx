import { useEffect, useState } from "react";
import { nextDrawLabel } from "../lib/feedAlgorithm";

export default function Countdown() {
  const [time, setTime] = useState(nextDrawLabel());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(nextDrawLabel());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 px-4 py-3 text-sm font-black text-cyan-200">
      ⏳ Päiväpotti päättyy: {time}
    </div>
  );
}
