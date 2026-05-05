// src/lib/xpEvents.js

const globalKey = "__xp_event_bus__";

if (!window[globalKey]) {
  window[globalKey] = {
    listeners: [],
  };
}

const bus = window[globalKey];

export function emitXPEvent(event) {
  console.log("EMIT XP", event);
  bus.listeners.forEach((fn) => fn(event));
}

export function onXPEvent(fn) {
  bus.listeners.push(fn);

  return () => {
    const i = bus.listeners.indexOf(fn);
    if (i > -1) bus.listeners.splice(i, 1);
  };
}
