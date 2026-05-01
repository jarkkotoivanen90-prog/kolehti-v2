import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function num(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function scorePost(post: Record<string, unknown>, votes: number) {
  const aiScore = num(post.ai_score, 50);
  const quality = num(post.ai_quality ?? post.growth_score, 50);
  const boost = num(post.boost_score, 0);
  const shares = num(post.shares, 0);
  const views = num(post.views ?? post.view_count, 0);
  const watchTime = num(post.watch_time_total, 0);
  const weeklyBoost = post.weekly_entry || post.week_id ? 1.12 : 1;
  const mediaBoost = post.media_url || post.image_url || post.video_url ? 1.06 : 1;

  const raw =
    votes * 12 +
    aiScore * 1.1 +
    quality * 0.8 +
    boost * 4 +
    shares * 8 +
    watchTime * 2 +
    Math.log(views + 1) * 6;

  return Math.max(0, Math.round(raw * weeklyBoost * mediaBoost));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "POST only" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const postIds = Array.isArray(body.postIds)
      ? body.postIds.filter(Boolean).slice(0, 300)
      : [];
    const persist = body.persist !== false;

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing env: SUPABASE_URL or SERVICE_ROLE_KEY" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let postsQuery = supabase.from("posts").select("*");
    if (postIds.length > 0) {
      postsQuery = postsQuery.in("id", postIds);
    } else {
      postsQuery = postsQuery.order("created_at", { ascending: false }).limit(300);
    }

    const { data: postsData, error: postsError } = await postsQuery;
    if (postsError) throw postsError;

    const posts = Array.isArray(postsData) ? postsData : [];
    const ids = posts.map((post) => post.id).filter(Boolean);

    const { data: votesData, error: votesError } = ids.length
      ? await supabase.from("votes").select("post_id,value").in("post_id", ids)
      : { data: [], error: null };
    if (votesError) throw votesError;

    const voteMap = new Map<string, number>();
    for (const vote of votesData || []) {
      const postId = String(vote.post_id);
      voteMap.set(postId, (voteMap.get(postId) || 0) + num(vote.value, 1));
    }

    const calculatedAt = new Date().toISOString();

    const scores = posts.map((post) => {
      const postId = String(post.id);
      const voteCount = voteMap.get(postId) || num(post.votes ?? post.vote_count, 0);
      const score = scorePost(post, voteCount);

      return {
        id: postId,
        post_id: postId,
        score,
        backend_score: score,
        winner_score: score,
        votes: voteCount,
        vote_count: voteCount,
        calculated_at: calculatedAt,
      };
    });

    scores.sort((a, b) => b.score - a.score);

    let persisted = 0;
    const persistErrors: string[] = [];

    if (persist) {
      for (const item of scores) {
        const { error } = await supabase
          .from("posts")
          .update({
            score: item.score,
            backend_score: item.backend_score,
            winner_score: item.winner_score,
            votes: item.votes,
            vote_count: item.vote_count,
            backend_scored_at: item.calculated_at,
          })
          .eq("id", item.post_id);

        if (error) persistErrors.push(`${item.post_id}: ${error.message}`);
        else persisted += 1;
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        count: scores.length,
        persisted,
        persistErrors,
        leaderboard: scores,
        scores,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error?.message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
