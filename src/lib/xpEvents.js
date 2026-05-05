let listeners = [];

export function emitXP(value) {
  listeners.forEach((fn) => fn(value));
}

export function onXPEvent(fn) {
  listeners.push(fn);

  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}
