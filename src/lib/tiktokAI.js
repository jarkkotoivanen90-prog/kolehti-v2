import { supabase } from "./supabaseClient";

export function getTikTokScore(post, userEvents = []) {
  const votes = Number(post.vote_count || 0);
  const ai = Number(post.ai_score || 0);
  const views = Number(post.view_count || 0);
  const boost = Number(post.boost_score || 0);

  const createdAt = post.created_at ? new Date(post.created_at).getTime() : Date.now();
  const hoursOld = Math.max(1, (Date.now() - createdAt) / 1000 / 60 / 60);

  const freshness = Math.max(0, 120 - hoursOld * 3);
  const voteRate = votes / Math.max(1, hoursOld);
  const conversion = votes / Math.max(1, views);

  const userAffinity = userEvents
    .filter((event) => event.post_id === post.id)
    .reduce((sum, event) => sum + Number(event.weight || 0), 0);

  return (
    votes * 120 +
    ai * 2.5 +
    boost * 80 +
    freshness +
    voteRate * 90 +
    conversion * 150 +
    userAffinity * 30
  );
}

export function rankForYou(posts = [], userEvents = []) {
  return posts
    .map((post) => ({
      ...post,
      for_you_score: getTikTokScore(post, userEvents),
    }))
    .sort((a, b) => b.for_you_score - a.for_you_score);
}

export async function trackEvent({ userId, postId, type, weight = 1 }) {
  if (!type) return;

  await supabase.from("user_events").insert({
    user_id: userId || null,
    post_id: postId || null,
    event_type: type,
    weight,
  });
}

export async function increaseView(postId) {
  if (!postId) return;

  const { data } = await supabase
    .from("posts")
    .select("view_count")
    .eq("id", postId)
    .single();

  await supabase
    .from("posts")
    .update({
      view_count: Number(data?.view_count || 0) + 1,
      last_engaged_at: new Date().toISOString(),
    })
    .eq("id", postId);
}
