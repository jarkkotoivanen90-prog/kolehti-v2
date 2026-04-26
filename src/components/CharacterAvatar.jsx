export default function CharacterAvatar({
  character,
  size = "md",
}) {
  const sizes = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32",
  };

  return (
    <div className={`relative ${sizes[size]}`}>
      {/* Glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 blur-md" />

      {/* Avatar image */}
      <img
        src={character.image}
        alt={character.name}
        className="relative h-full w-full rounded-full object-cover border-2 border-white/20 shadow-xl"
      />
    </div>
  );
}
