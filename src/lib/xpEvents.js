const listeners = new Set();

/**
 * Kuuntele XP eventtejä
 */
export function onXPEvent(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/**
 * Lähetä XP event
 */
export function emitXPEvent(event) {
  listeners.forEach((cb) => {
    try {
      cb(event);
    } catch (e) {
      console.error("XP listener error", e);
    }
  });
}
