import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useMentorFeedback() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('id').eq('auth_user_id', user.id).maybeSingle();
      if (!profile) return;
      const { data } = await supabase.from('mentor_feedback').select('*').eq('profile_id', profile.id).order('created_at', { ascending: false }).limit(10);
      setItems(data || []);
    }
    load();
  }, []);
  return items;
}
