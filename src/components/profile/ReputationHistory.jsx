import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function ReputationHistory() {
  const [history, setHistory] = useState([]);
  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/reputation-history", { headers: { Authorization: `Bearer ${session?.access_token || ""}` } });
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    }
    load();
  }, []);
  if (!history.length) return null;
  return (
    <div className="glass-card p-4">
      <div className="text-lg font-black">Mainehistoria</div>
      <div className="mt-4 flex items-end gap-1 h-20">
        {history.slice().reverse().map((h, i) => (
          <div key={i} className={`w-2 ${Number(h.delta || 0) >= 0 ? "bg-green-400" : "bg-rose-400"}`} style={{ height: `${Number(h.new_score || 0.5) * 100}%` }} />
        ))}
      </div>
    </div>
  );
}
