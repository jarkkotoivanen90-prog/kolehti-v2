import { supabase } from '../_supabaseAdmin.js';

export async function handleInviteActivation(profileId) {
  const { data: profile } = await supabase.from('profiles').select('id, invited_by').eq('id', profileId).maybeSingle();
  if (!profile?.invited_by) return { activated: false };
  const { data: invite } = await supabase.from('invites').select('*').eq('invited_id', profileId).maybeSingle();
  if (!invite || invite.status === 'activated') return { activated: false };
  await supabase.from('invites').update({ status: 'activated', activated_at: new Date().toISOString() }).eq('id', invite.id);
  await supabase.rpc('increment_invite_stats', { user_id: profile.invited_by });
  return { activated: true };
}
