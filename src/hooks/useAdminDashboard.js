import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useAdminDashboard() {
  const [data, setData] = useState(null);
  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/dashboard', { headers: { Authorization: `Bearer ${session?.access_token || ''}` } });
      setData(await res.json());
    }
    load();
  }, []);
  return data;
}
