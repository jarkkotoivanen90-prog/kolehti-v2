const listeners = new Set();

export function emitXPEvent(data) {
  listeners.forEach((fn) => fn(data));
}

export function onXPEvent(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
