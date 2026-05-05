import { motion } from "framer-motion";
import { getMedia } from "./utils/feedFormatters";

export default function FeedMedia({ post, active }) {
  const media = getMedia(post);

  const fallback =
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1400";

  const type = media?.type;
  const url = media?.url || fallback;

  const baseClass =
    "absolute inset-0 h-full w-full object-cover object-center";

  const enhanceStyle = {
    filter: "contrast(1.1) saturate(1.1) brightness(1.02)",
    transform: "translateZ(0)",
  };

  // 🎥 VIDEO
  if (type === "video") {
    return (
      <motion.video
        key={url}
        src={url}
        className={baseClass}
        style={enhanceStyle}
        initial={{ scale: 1.05 }}
        animate={{ scale: active ? 1.08 : 1.05 }}
        transition={{ duration: 6 }}
        autoPlay={active}
        muted
        loop
        playsInline
        preload={active ? "auto" : "metadata"}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }

  // 🖼️ IMAGE
  return (
    <motion.img
      key={url}
      src={url}
      alt=""
      className={baseClass}
      style={enhanceStyle}
      initial={{ scale: 1.05 }}
      animate={{ scale: active ? 1.1 : 1.05 }}
      transition={{ duration: 6 }}
      loading={active ? "eager" : "lazy"}
      fetchPriority={active ? "high" : "auto"}
      decoding="async"
      onError={(e) => {
        e.currentTarget.src = fallback;
      }}
    />
  );
}
