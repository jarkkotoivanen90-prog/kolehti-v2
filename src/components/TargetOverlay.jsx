async function load() {
  try {
    const next = await getMyTarget();

    if (!next) {
      setVisible(false);
      return;
    }

    const prevDiff = lastDiffRef.current;

    // 🔥 EI mitään jos sama diff
    if (prevDiff !== null && Math.round(prevDiff) === Math.round(next.diff)) {
      return;
    }

    lastDiffRef.current = next.diff;

    setTarget(next);
    setVisible(true);

    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
    }, 2500);

  } catch (err) {
    console.warn("TargetOverlay load failed:", err);
  }
}
