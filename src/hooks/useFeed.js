import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useFeed(drawType = "day") {
  const [entries, setEntries] = useState([]);
  const [drawId, setDrawId] = useState(null);

  const load = useCallback(async () => {
    const session = supabase ? await supabase.auth.getSession() : { data: { session: null } };
    const token = session?.data?.session?.access_token || "";
    const res = await fetch(`/api/leaderboard?drawType=${drawType}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setEntries(Array.isArray(data) ? data : []);

    if (supabase) {
      const { data: draw } = await supabase.from("draws").select("*").eq("type", drawType).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();
      setDrawId(draw?.id || null);
    }
  }, [drawType]);

  const optimisticVote = useCallback((postId, weight = 1) => {
    let previous = [];
    setEntries((prev) => {
      previous = prev;
      return prev.map((item) => item.id === postId ? { ...item, votes: Number(item.votes || 0) + Number(weight) } : item);
    });
    return () => setEntries(previous);
  }, []);

  const optimisticBoost = useCallback((postId, gain = 0.1) => {
    let previous = [];
    setEntries((prev) => {
      previous = prev;
      return prev.map((item) => item.id === postId ? { ...item, boost_count: Number(item.boost_count || 0) + 1, boost_visibility: Number((Number(item.boost_visibility || 0) + Number(gain)).toFixed(3)) } : item);
    });
    return () => setEntries(previous);
  }, []);

  useEffect(() => {
    load();
    if (!supabase) return;
    const channel = supabase.channel(`live-posts-${drawType}`).on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => load()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [drawType, load]);

  return { entries, drawId, reload: load, optimisticVote, optimisticBoost };
}
