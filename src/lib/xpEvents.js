const listeners = [];

export function emitXPEvent(event) {
  console.log("EMIT XP", event);
  listeners.forEach((fn) => fn(event));
}

export function onXPEvent(fn) {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i > -1) listeners.splice(i, 1);
  };
}
