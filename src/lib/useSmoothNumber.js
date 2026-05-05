import { useEffect, useRef, useState } from "react";

export function useSmoothNumber(value, duration = 700) {
  const [display, setDisplay] = useState(Number(value || 0));
  const frameRef = useRef(null);

  useEffect(() => {
    const start = display;
    const end = Number(value || 0);
    const startTime = performance.now();

    cancelAnimationFrame(frameRef.current);

    function animate(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);

      setDisplay(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    }

    frameRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameRef.current);
  }, [value]);

  return display;
}
