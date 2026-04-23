import { supabase } from "../lib/supabaseClient";

export function useVote() {
  async function vote(postId, drawType = "day") {
    const session = supabase ? await supabase.auth.getSession() : { data: { session: null } };
    const res = await fetch("/api/vote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.data?.session?.access_token || ""}`,
      },
      body: JSON.stringify({ postId, drawType }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Äänestys epäonnistui");
    return data;
  }
  return { vote };
}
