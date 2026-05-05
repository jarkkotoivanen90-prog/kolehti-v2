const listeners = new Set();

export function emitXPEvent(event) {
  listeners.forEach((fn) => {
    try {
      fn(event);
    } catch {}
  });
}

export function onXPEvent(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
