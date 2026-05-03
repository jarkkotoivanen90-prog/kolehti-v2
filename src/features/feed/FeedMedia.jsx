import { motion } from "framer-motion";
import { getMedia } from "./utils/feedFormatters";

export default function FeedMedia({ post, active }) {
  const media = getMedia(post);
  const className = "absolute inset-0 h-full w-full object-cover opacity-100";

  if (media.type === "video") {
    return (
      <video
        src={media.url}
        className={className}
        autoPlay={active}
        muted
        loop
        playsInline
        preload={active ? "auto" : "metadata"}
      />
    );
  }

  return (
    <motion.img
      src={media.url}
      alt=""
      className={className}
      loading={active ? "eager" : "lazy"}
      decoding="async"
      animate={{ scale: active ? 1.01 : 1.05 }}
      transition={{ duration: 1.2 }}
    />
  );
}
