import { supabase } from '../_supabaseAdmin.js';
import { requireAdmin } from '../_requireAdmin.js';
import { computeFeedScore } from '../lib/feedRanking.js';

export default async function handler(req, res) {
  try {
    await requireAdmin(req);
    const { data: draw } = await supabase.from('draws').select('*').eq('type', 'day').eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (!draw) return res.json([]);
    const { data: posts } = await supabase.from('posts').select('*, profile:profiles(display_name, reputation_score)').eq('draw_id', draw.id).eq('status', 'active');
    const items = (posts || []).map((p) => ({ ...p, computed_score: computeFeedScore(p, p.profile || {}) })).sort((a,b)=>Number(b.computed_score||0)-Number(a.computed_score||0));
    res.json(items);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'feed debug failed' });
  }
}
