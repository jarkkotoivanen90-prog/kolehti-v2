import { motion } from "framer-motion";
import { getMedia } from "./utils/feedFormatters";

export default function FeedMedia({ post, active }) {
  const media = getMedia(post);

  const baseClass =
    "absolute inset-0 h-full w-full object-cover object-center will-change-transform";

  const enhanceStyle = {
    filter: "contrast(1.06) saturate(1.08)",
    transform: "translateZ(0)",
  };

  // 🎥 VIDEO
  if (media.type === "video") {
    return (
      <motion.video
        src={media.url}
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
      />
    );
  }

  // 🖼 IMAGE
  return (
    <motion.img
      src={media.url}
      alt=""
      className={baseClass}
      style={enhanceStyle}
      initial={{ scale: 1.05 }}
      animate={{ scale: active ? 1.1 : 1.05 }}
      transition={{ duration: 6, ease: "easeOut" }}
      loading={active ? "eager" : "lazy"}
      fetchPriority={active ? "high" : "auto"}
      decoding="async"
    />
  );
}
