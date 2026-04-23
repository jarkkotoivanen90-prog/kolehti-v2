import { supabase } from "../lib/supabaseClient";

export function useBoost() {
  async function boost(postId) {
    const session = supabase ? await supabase.auth.getSession() : { data: { session: null } };
    const res = await fetch("/api/boost-post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.data?.session?.access_token || ""}`,
      },
      body: JSON.stringify({ postId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Boost epäonnistui");
    return data;
  }
  return { boost };
}
