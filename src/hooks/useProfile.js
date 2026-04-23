import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useProfile() {
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("auth_user_id", user.id).maybeSingle();
      setProfile(data || null);
    }
    load();
  }, []);
  return profile;
}
