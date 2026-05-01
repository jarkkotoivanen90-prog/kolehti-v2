// Supabase Edge Function: calculate-score
// Deploy with: supabase functions deploy calculate-score
// Env required in Supabase: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function number(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function calculateScore(post: Record<string, unknown>, votes: number) {
  const aiScore = number(post.ai_score ?? post.growth_score, 50);
  const growthScore = number(post.growth_score ?? post.ai_score, 50);
  const boostScore = number(post.boost_score, 0);
  const watchTime = number(post.watch_time_total, 0);
  const shares = number(post.shares, 0);
  const weeklyBoost = post.weekly_entry || post.week_id ? 1.12 : 1;
  const mediaBoost = post.media_url || post.image_url || post.video_url ? 1.06 : 1;

  const raw =
    votes * 12 +
    aiScore +
    growthScore * 0.55 +
    boostScore * 4 +
    watchTime * 2 +
    shares * 6;

  return Math.max(0, Math.round(raw * weeklyBoost * mediaBoost));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { postIds } = await req.json();
    const ids = Array.isArray(postIds) ? postIds.filter(Boolean).slice(0, 300) : [];

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase env" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let postsQuery = supabase.from("posts").select("*");
    if (ids.length) postsQuery = postsQuery.in("id", ids);
    else postsQuery = postsQuery.order("created_at", { ascending: false }).limit(300);

    const { data: posts, error: postsError } = await postsQuery;
    if (postsError) throw postsError;

    const actualIds = (posts || []).map((post: Record<string, unknown>) => post.id).filter(Boolean);
    const { data: votes, error: votesError } = actualIds.length
      ? await supabase.from("votes").select("post_id,value").in("post_id", actualIds)
      : { data: [], error: null };

    if (votesError) throw votesError;

    const voteMap = new Map<string, number>();
    for (const vote of votes || []) {
      const postId = String(vote.post_id);
      voteMap.set(postId, (voteMap.get(postId) || 0) + number(vote.value, 1));
    }

    const scores = (posts || []).map((post: Record<string, unknown>) => {
      const postId = String(post.id);
      const voteCount = voteMap.get(postId) || number(post.votes ?? post.vote_count, 0);
      return {
        post_id: postId,
        votes: voteCount,
        score: calculateScore(post, voteCount),
        calculated_at: new Date().toISOString(),
      };
    });

    return new Response(JSON.stringify({ scores }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
