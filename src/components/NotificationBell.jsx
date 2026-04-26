import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  getMyNotifications,
  markNotificationsRead,
} from "../lib/notifications";

export default function NotificationBell() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user || null);

    if (user) {
      const data = await getMyNotifications(user.id);
      setItems(data);
    }
  }

  async function toggle() {
    const next = !open;
    setOpen(next);

    if (next && user) {
      await markNotificationsRead(user.id);
      const data = await getMyNotifications(user.id);
      setItems(data);
    }
  }

  const unread = items.filter((item) => !item.read).length;

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className="relative rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-black text-white"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-pink-500 text-[10px]">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-3xl border border-white/10 bg-[#081226] p-4 shadow-2xl">
          <h3 className="mb-3 text-lg font-black text-white">Ilmoitukset</h3>

          {items.length === 0 ? (
            <p className="text-sm text-white/50">Ei ilmoituksia vielä.</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-white/10 p-3"
                >
                  <div className="text-sm font-black text-cyan-200">
                    {item.title}
                  </div>
                  <p className="mt-1 text-xs text-white/60">{item.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
