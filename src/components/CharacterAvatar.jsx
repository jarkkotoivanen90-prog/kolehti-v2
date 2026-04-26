export default function CharacterAvatar({
  character,
  size = "lg",
  showInfo = true,
  rank,
}) {
  const sizes = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
    xl: "h-44 w-44",
  };

  const c = {
    skin: character.skinHex || "#E8B08E",
    hair: character.hairHex || "#5B3526",
    outfit: character.outfitHex || "#2563EB",
    accent: character.accentHex || "#22D3EE",
    bg1: character.bg1 || "#2563EB",
    bg2: character.bg2 || "#EC4899",
  };

  if (character.id === "kai") {
    return (
      <div className="group relative">
        <div
          className={`${sizes[size]} relative mx-auto overflow-hidden rounded-[30px] border border-cyan-300/40 bg-gradient-to-br from-cyan-400/30 to-blue-700/40 shadow-2xl transition duration-300 group-hover:-translate-y-2 group-hover:scale-105`}
        >
          <svg viewBox="0 0 200 200" className="h-full w-full">
            <circle cx="100" cy="100" r="90" fill="#EAF7FF" />
            <rect x="43" y="55" width="114" height="88" rx="34" fill="#111827" />
            <rect x="51" y="63" width="98" height="72" rx="28" fill="#020617" />
            <circle cx="78" cy="94" r="8" fill="#67E8F9" />
            <circle cx="122" cy="94" r="8" fill="#67E8F9" />
            <path d="M82 116 Q100 130 118 116" stroke="#67E8F9" strokeWidth="6" fill="none" strokeLinecap="round" />
            <circle cx="35" cy="92" r="12" fill="#38BDF8" />
            <circle cx="165" cy="92" r="12" fill="#38BDF8" />
            <rect x="93" y="32" width="14" height="22" rx="7" fill="#EAF7FF" />
            <circle cx="100" cy="28" r="8" fill="#38BDF8" />
          </svg>
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

      <div
        className={`${sizes[size]} relative mx-auto overflow-hidden rounded-[32px] border border-white/15 shadow-2xl transition duration-300 group-hover:-translate-y-2 group-hover:scale-105`}
      >
        <svg viewBox="0 0 200 200" className="h-full w-full">
          <defs>
            <linearGradient id={`bg-${character.id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={c.bg1} />
              <stop offset="100%" stopColor={c.bg2} />
            </linearGradient>

            <linearGradient id={`face-${character.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.skin} />
              <stop offset="100%" stopColor="#C98565" />
            </linearGradient>

            <filter id={`shadow-${character.id}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="7" floodOpacity="0.35" />
            </filter>
          </defs>

          <rect width="200" height="200" rx="38" fill={`url(#bg-${character.id})`} />

          <circle cx="160" cy="38" r="55" fill="rgba(255,255,255,0.18)" />
          <circle cx="45" cy="165" r="70" fill="rgba(255,255,255,0.10)" />

          <g filter={`url(#shadow-${character.id})`}>
            <path
              d="M47 190 C52 145 70 128 100 128 C130 128 148 145 153 190 Z"
              fill={c.outfit}
            />

            <path
              d="M64 191 C66 158 80 140 100 140 C120 140 134 158 136 191 Z"
              fill="rgba(255,255,255,0.16)"
            />

            <ellipse cx="100" cy="96" rx="48" ry="55" fill={`url(#face-${character.id})`} />

            <path
              d="M54 90 C55 48 80 30 105 34 C139 39 154 64 147 103 C137 80 124 65 101 61 C78 57 64 68 54 90 Z"
              fill={c.hair}
            />

            <path
              d="M57 86 C44 97 45 121 62 129 C56 113 58 98 70 86 Z"
              fill={c.hair}
            />

            <path
              d="M143 86 C156 97 155 121 138 129 C144 113 142 98 130 86 Z"
              fill={c.hair}
            />

            <circle cx="82" cy="96" r="5" fill="#111827" />
            <circle cx="118" cy="96" r="5" fill="#111827" />

            <circle cx="80" cy="94" r="1.7" fill="white" />
            <circle cx="116" cy="94" r="1.7" fill="white" />

            <path
              d="M76 83 Q83 78 91 83"
              stroke={c.hair}
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />

            <path
              d="M109 83 Q117 78 125 83"
              stroke={c.hair}
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />

            <path
              d="M92 119 Q100 127 110 119"
              stroke="#8B2F3C"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />

            <circle cx="64" cy="108" r="8" fill="rgba(244,114,182,0.28)" />
            <circle cx="136" cy="108" r="8" fill="rgba(244,114,182,0.28)" />

            <circle cx="145" cy="150" r="17" fill={c.accent} />
            <text x="145" y="157" textAnchor="middle" fontSize="20" fontWeight="900">
              {character.emoji || "💙"}
            </text>
          </g>
        </svg>
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
