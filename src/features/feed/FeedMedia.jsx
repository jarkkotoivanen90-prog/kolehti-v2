import { getMedia } from "./utils/feedFormatters";

export default function FeedMedia({ post, active }) {
  const media = getMedia(post);

  // 🔥 yhteiset stylet → TERÄVÄ KUVA / VIDEO
  const baseClass =
    "absolute inset-0 h-full w-full object-cover object-center will-change-transform";

  const enhanceStyle = {
    filter: "contrast(1.06) saturate(1.08)", // pieni boost → näyttää terävämmältä
    imageRendering: "auto",
    transform: "translateZ(0)", // GPU fix → vähemmän bluria mobiilissa
  };

  // 🎥 VIDEO
  if (media.type === "video") {
    return (
      <video
        src={media.url}
        className={baseClass}
        style={enhanceStyle}
        autoPlay={active}
        muted
        loop
        playsInline
        preload={active ? "auto" : "metadata"}
      />
    );
  }

  // 🖼 IMAGE
  return (
    <img
      src={media.url}
      alt=""
      className={baseClass}
      style={enhanceStyle}
      loading={active ? "eager" : "lazy"}
      fetchPriority={active ? "high" : "auto"}
      decoding="async"
    />
  );
}
