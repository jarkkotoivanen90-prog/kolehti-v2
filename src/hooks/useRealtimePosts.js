import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useRealtimePosts(onChange, drawType='day') {
  useEffect(() => {
    const channel = supabase
      .channel(`posts-${drawType}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (payload) => onChange?.(payload))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [onChange, drawType]);
}
