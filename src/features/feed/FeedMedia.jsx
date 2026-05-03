import { motion } from "framer-motion";
import { getMedia } from "./utils/feedFormatters";

export default function FeedMedia({ post, active }) {
  const media = getMedia(post);
  const className = "absolute inset-0 h-full w-full object-cover opacity-100 will-change-transform";

  if (media.type === "video") {
    return (
      <motion.video
        src={media.url}
        className={className}
        autoPlay={active}
        muted
        loop
        playsInline
        preload={active ? "auto" : "metadata"}
        animate={{ scale: active ? 1.018 : 1.045, y: active ? 0 : 10 }}
        transition={{ duration: 1.35, ease: [0.22, 1, 0.36, 1] }}
      />
    );
  }

  return (
    <motion.img
      src={media.url}
      alt=""
      className={className}
      loading={active ? "eager" : "lazy"}
      fetchPriority={active ? "high" : "auto"}
      decoding="async"
      animate={{ scale: active ? 1.018 : 1.055, y: active ? 0 : 12 }}
      transition={{ duration: 1.35, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}
