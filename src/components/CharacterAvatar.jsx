export default function CharacterAvatar({
  character,
  size = "lg",
  showInfo = true,
  rank,
}) {
  const isKai = character.id === "kai";

  const sizes = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
    xl: "h-44 w-44",
  };

  if (isKai) {
    return (
      <div className="group relative">
        <div className={`${sizes[size]} relative mx-auto rounded-[32px] border border-cyan-300/30 bg-gradient-to-br from-cyan-300/30 to-blue-600/30 p-3 shadow-2xl transition duration-300 group-hover:-translate-y-2 group-hover:scale-105`}>
          <div className="absolute -inset-2 rounded-[36px] bg-cyan-400/20 blur-xl opacity-70" />

          <div className="relative flex h-full w-full flex-col items-center justify-center rounded-[28px] bg-slate-900">
            <div className="absolute -left-2 top-7 h-4 w-4 rounded-full bg-cyan-300" />
            <div className="absolute -right-2 top-7 h-4 w-4 rounded-full bg-cyan-300" />

            <div className="mb-2 h-16 w-20 rounded-[24px] border border-cyan-300/40 bg-black shadow-inner">
              <div className="mt-5 flex justify-center gap-5">
                <div className="h-3 w-3 rounded-full bg-cyan-300 shadow-lg shadow-cyan-300/60" />
                <div className="h-3 w-3 rounded-full bg-cyan-300 shadow-lg shadow-cyan-300/60" />
              </div>
              <div className="mx-auto mt-3 h-2 w-8 rounded-full bg-cyan-300/70" />
            </div>

            <div className="text-xs font-black text-cyan-200">KAI</div>
          </div>
        </div>

        {showInfo && (
          <div className="mt-3 text-center">
            <div className="font-black text-white">{character.name}</div>
            <div className="text-xs text-white/55">{character.role}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="group relative">
      {rank && (
        <div className="absolute -left-2 -top-2 z-20 grid h-9 w-9 place-items-center rounded-full bg-cyan-500 text-sm font-black text-white shadow-xl">
          {rank}
        </div>
      )}

      <div className={`${sizes[size]} relative mx-auto overflow-hidden rounded-[34px] border border-white/10 bg-gradient-to-br ${character.bg} p-3 shadow-2xl transition duration-300 group-hover:-translate-y-2 group-hover:scale-105`}>
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/30 blur-2xl" />

        <div className="relative h-full w-full">
          <div className={`absolute bottom-0 left-1/2 h-16 w-24 -translate-x-1/2 rounded-t-[32px] ${character.outfit}`} />
          <div className={`absolute bottom-9 left-1/2 h-20 w-20 -translate-x-1/2 rounded-[28px] ${character.skin} shadow-xl`} />

          <div className={`absolute bottom-[78px] left-1/2 h-10 w-24 -translate-x-1/2 rounded-t-full ${character.hair}`} />
          <div className={`absolute bottom-[66px] left-4 h-12 w-7 rounded-full ${character.hair}`} />
          <div className={`absolute bottom-[66px] right-4 h-12 w-7 rounded-full ${character.hair}`} />

          <div className="absolute bottom-[67px] left-[42%] h-2 w-2 rounded-full bg-slate-900" />
          <div className="absolute bottom-[67px] right-[42%] h-2 w-2 rounded-full bg-slate-900" />
          <div className="absolute bottom-[55px] left-1/2 h-2 w-7 -translate-x-1/2 rounded-full bg-rose-500/70" />

          <div className={`absolute bottom-6 right-4 grid h-9 w-9 place-items-center rounded-full ${character.accent} text-lg shadow-lg`}>
            {character.emoji}
          </div>
        </div>
      </div>

      {showInfo && (
        <div className="mt-3 text-center">
          <div className="font-black text-white">
            {character.name}, {character.age}
          </div>
          <div className="text-xs text-white/55">
            {character.role} · {character.city}
          </div>
        </div>
      )}
    </div>
  );
}
