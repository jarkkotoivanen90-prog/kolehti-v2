import { motion } from "framer-motion";
import { getMedia } from "./utils/feedFormatters";

export default function FeedMedia({ post, active }) {
  const media = getMedia(post);

  const baseClass =
    "absolute inset-0 h-full w-full object-cover object-center";

  const enhanceStyle = {
    filter: "contrast(1.1) saturate(1.1) brightness(1.02)",
    transform: "translateZ(0)",
  };

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
      />
    );
  }

  return (
    <motion.img
      src={media.url}
      alt=""
      className={baseClass}
      style={enhanceStyle}
      initial={{ scale: 1.05 }}
      animate={{ scale: active ? 1.1 : 1.05 }}
      transition={{ duration: 6 }}
      loading={active ? "eager" : "lazy"}
    />
  );
}
