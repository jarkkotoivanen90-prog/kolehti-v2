const listeners = new Set();

export function emitXPEvent(data) {
  listeners.forEach((fn) => {
    try {
      fn(data);
    } catch (err) {
      console.error("XP listener error:", err);
    }
  });
}

export function onXPEvent(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
