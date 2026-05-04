import { useCallback, useEffect, useRef, useState } from "react";

const SCROLL_STOP_DELAY = 140;
const SCROLL_HIDE_THRESHOLD = 8;

export function useFeedHUD() {
  const [visible, setVisible] = useState(true);
  const [pulseKey, setPulseKey] = useState(0);
  const lastScrollTopRef = useRef(0);
  const stopTimerRef = useRef(null);
  const leaderRef = useRef(null);

  const onScroll = useCallback((scrollTop) => {
    const previous = lastScrollTopRef.current;
    const delta = scrollTop - previous;
    lastScrollTopRef.current = scrollTop;

    if (delta > SCROLL_HIDE_THRESHOLD) setVisible(false);
    if (delta < -SCROLL_HIDE_THRESHOLD) setVisible(true);

    window.clearTimeout(stopTimerRef.current);
    stopTimerRef.current = window.setTimeout(() => setVisible(true), SCROLL_STOP_DELAY);
  }, []);

  const reveal = useCallback(() => {
    setVisible(true);
    window.clearTimeout(stopTimerRef.current);
  }, []);

  const trackLeader = useCallback((leaderId) => {
    if (!leaderId) return;
    if (leaderRef.current && leaderRef.current !== leaderId) {
      setPulseKey((value) => value + 1);
    }
    leaderRef.current = leaderId;
  }, []);

  useEffect(() => () => window.clearTimeout(stopTimerRef.current), []);

  return { visible, onScroll, reveal, trackLeader, pulseKey };
}
