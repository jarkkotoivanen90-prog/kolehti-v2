export default function LevelUpModal({ level, onClose }) {
  if (!level) return null;

  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/70 px-4 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-[38px] border border-yellow-300/30 bg-[#081226] p-7 text-center text-white shadow-2xl">
        <div className="text-7xl">⚡</div>

        <div className="mt-4 text-xs font-black uppercase tracking-[0.3em] text-yellow-200">
          Level Up
        </div>

        <h2 className="mt-3 text-5xl font-black text-yellow-300">
          LVL {level}
        </h2>

        <p className="mt-3 text-sm font-bold text-white/65">
          Uusi taso avattu. Profiilisi vahvistuu ja näkyvyytesi kasvaa.
        </p>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-yellow-400 px-5 py-4 text-lg font-black text-black"
        >
          Jatka
        </button>
      </div>
    </div>
  );
}
