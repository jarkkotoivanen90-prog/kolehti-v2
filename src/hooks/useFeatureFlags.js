import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useFeatureFlags() {
  const [flags, setFlags] = useState(null);
  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/config', { headers: { Authorization: `Bearer ${session?.access_token || ''}` } });
      const json = await res.json();
      setFlags(json.feature_flags || null);
    }
    load();
  }, []);
  return flags;
}
