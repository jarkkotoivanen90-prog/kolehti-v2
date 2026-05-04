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
    <img
      src={media.url}
      alt=""
      className={className}
      loading={active ? "eager" : "lazy"}
      fetchPriority={active ? "high" : "auto"}
      decoding="async"
    />
  );
}
