import { useEffect, useRef } from "react";
import { getMedia } from "./utils/feedFormatters";

const PARALLAX_STRENGTH = -0.045;

export default function FeedMedia({ post, active }) {
  const media = getMedia(post);
  const mediaRef = useRef(null);
  const frameRef = useRef(null);
  const className = "absolute inset-0 h-[108%] w-full object-cover opacity-100 will-change-transform";

  useEffect(() => {
    const el = mediaRef.current;
    if (!el || !active) {
      if (el) el.style.transform = "translate3d(0,0,0) scale(1.02)";
      return undefined;
    }

    const update = () => {
      frameRef.current = null;
      const rect = el.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const offset = Math.max(-28, Math.min(28, rect.top * PARALLAX_STRENGTH));
      el.style.transform = `translate3d(0, ${offset}px, 0) scale(1.02)`;
    };

    const requestUpdate = () => {
      if (frameRef.current) return;
      frameRef.current = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [active, media.url]);

  if (media.type === "video") {
    return (
      <video
        ref={mediaRef}
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
      ref={mediaRef}
      src={media.url}
      alt=""
      className={className}
      loading={active ? "eager" : "lazy"}
      fetchPriority={active ? "high" : "auto"}
      decoding="async"
    />
  );
}
