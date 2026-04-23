import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useNearMiss() {
  const [nearMiss, setNearMiss] = useState(null);
  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/near-miss", { headers: { Authorization: `Bearer ${session?.access_token || ""}` } });
      const data = await res.json();
      setNearMiss(data?.near_miss || null);
    }
    load();
  }, []);
  return nearMiss;
}
