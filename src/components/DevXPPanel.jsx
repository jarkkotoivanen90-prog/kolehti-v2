import { xpEvent } from "../lib/xp";

export default function DevXPPanel() {
  if (import.meta.env.PROD) return null; // ❗ ei näy tuotannossa

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-black/60 p-4 text-white backdrop-blur">
      
      <div className="text-xs font-bold uppercase text-white/60 mb-3">
        DEV XP PANEL
      </div>

      <div className="flex flex-wrap gap-2">
        
        <button
          onClick={() => xpEvent("like", null, 10)}
          className="px-3 py-2 rounded bg-cyan-500 text-xs font-bold"
        >
          +10 XP
        </button>

        <button
          onClick={() => xpEvent("comment", null, 20)}
          className="px-3 py-2 rounded bg-blue-500 text-xs font-bold"
        >
          +20 XP
        </button>

        <button
          onClick={() => xpEvent("share", null, 40)}
          className="px-3 py-2 rounded bg-purple-500 text-xs font-bold"
        >
          +40 XP
        </button>

        <button
          onClick={() => {
            xpEvent("combo", null, 15);
            setTimeout(() => xpEvent("combo", null, 15), 200);
            setTimeout(() => xpEvent("combo", null, 15), 400);
          }}
          className="px-3 py-2 rounded bg-yellow-500 text-xs font-bold text-black"
        >
          COMBO 🔥
        </button>

      </div>
    </div>
  );
}
