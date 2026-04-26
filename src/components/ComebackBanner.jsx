import { useEffect, useState } from "react";
import { getComebackMessage, updateLastSeen } from "../lib/retention";
import { supabase } from "../lib/supabaseClient";

export default function ComebackBanner() {
  const [message, setMessage] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const profile = await updateLastSeen(user.id);

    if (profile) {
      setMessage(getComebackMessage(profile));
      setShow(true);

      setTimeout(() => setShow(false), 5000);
    }
  }

  if (!show) return null;

  return (
    <div className="mb-5 rounded-[28px] border border-cyan-300/20 bg-cyan-500/10 p-4 text-sm font-black text-cyan-100 shadow-2xl">
      {message}
    </div>
  );
}
