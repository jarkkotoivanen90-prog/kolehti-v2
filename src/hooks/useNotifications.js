import { useCallback, useState } from "react";
let idCounter = 1;

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const remove = useCallback((id) => setNotifications((prev) => prev.filter((n) => n.id !== id)), []);
  const push = useCallback((message, type = "info", ttl = 2600) => {
    const id = idCounter++;
    setNotifications((prev) => [{ id, message, type }, ...prev]);
    if (ttl > 0) window.setTimeout(() => remove(id), ttl);
    return id;
  }, [remove]);
  return {
    notifications,
    remove,
    push,
    success: (m, ttl) => push(m, "success", ttl),
    error: (m, ttl) => push(m, "error", ttl),
    info: (m, ttl) => push(m, "info", ttl),
  };
}
