export default function CharacterAvatar({
  character,
  size = "md",
  showInfo = true,
  rank,
  compact = false,
}) {
  const sizes = {
    sm: {
      wrap: "h-14 w-14 rounded-2xl",
      inner: "rounded-[14px]",
      badge: "h-6 w-6 text-xs",
      name: "text-[10px]",
    },
    md: {
      wrap: "h-20 w-20 rounded-[24px]",
      inner: "rounded-[20px]",
      badge: "h-7 w-7 text-xs",
      name: "text-xs",
    },
    lg: {
      wrap: "h-28 w-28 rounded-[30px]",
      inner: "rounded-[25px]",
      badge: "h-8 w-8 text-sm",
      name: "text-sm",
    },
    xl: {
      wrap: "h-36 w-36 rounded-[36px]",
      inner: "rounded-[30px]",
      badge: "h-9 w-9 text-base",
      name: "text-sm",
    },
  };

  const s = sizes[size] || sizes.md;

  return (
    <div className="group relative inline-block">
      <style>{`
        @keyframes avatarFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }

        @keyframes avatarShine {
          0% { transform: translateX(-140%) rotate(16deg); }
          100% { transform: translateX(140%) rotate(16deg); }
        }

        @keyframes avatarPulse {
          0%, 100% { opacity: .45; transform: scale(.98); }
          50% { opacity: .9; transform: scale(1.05); }
        }

        .avatar-float {
          animation: avatarFloat 4s ease-in-out infinite;
        }

        .avatar-shine::after {
          content: "";
          position: absolute;
          top: -20%;
          bottom: -20%;
          width: 46%;
          left: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.28), transparent);
          animation: avatarShine 4.5s ease-in-out infinite;
        }

        .avatar-pulse {
          animation: avatarPulse 2.8s ease-in-out infinite;
        }
      `}</style>

      {rank && (
        <div className="absolute -left-2 -top-2 z-30 grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-yellow-300 to-orange-500 text-sm font-black text-slate-950 shadow-xl ring-2 ring-white/30">
          {rank}
        </div>
      )}

      <div
        className={`avatar-float relative ${s.wrap} bg-gradient-to-br ${
          character.accent || "from-blue-500 to-purple-700"
        } p-[3px] shadow-2xl ring-2 ${
          character.ring || "ring-white/20"
        } transition duration-300 group-hover:-translate-y-2 group-hover:scale-105`}
      >
        <div className="avatar-pulse absolute -inset-3 rounded-[38px] bg-gradient-to-br from-white/20 to-transparent blur-xl" />

        <div
          className={`avatar-shine relative h-full w-full overflow-hidden ${s.inner} bg-slate-950`}
        >
          <img
            src={character.image}
            alt={character.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

          <div className="absolute left-2 top-2 rounded-full bg-black/45 px-2 py-1 text-[10px] font-black text-white backdrop-blur-md">
            LVL {character.level || 1}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-2">
            <div className={`truncate font-black text-white ${s.name}`}>
              {character.name}
            </div>

            {!compact && (
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300"
                  style={{ width: `${character.trust || 50}%` }}
                />
              </div>
            )}
          </div>
        </div>

        <div
          className={`absolute -bottom-2 -right-2 grid ${s.badge} place-items-center rounded-full border border-white/30 bg-slate-950 shadow-xl`}
        >
          {character.badge || "💙"}
        </div>
      </div>

      {showInfo && (
        <div className="mt-3 text-center">
          <div className="font-black text-white">
            {character.name}
            {character.age ? `, ${character.age}` : ""}
          </div>

          <div className="text-xs text-white/55">
            {character.role}
            {character.city ? ` · ${character.city}` : ""}
          </div>

          {!compact && (
            <div className="mx-auto mt-2 inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-cyan-100">
              {character.rarity || "Jäsen"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
