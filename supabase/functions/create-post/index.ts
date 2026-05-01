import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function cleanPostContent(value: unknown) {
  return String(value || "")
    .replace(/\u0000/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1000);
}

function validatePostInput(content: unknown) {
  const clean = cleanPostContent(content);
  if (!clean) return { ok: false, content: clean, reason: "Perustelu puuttuu." };
  if (clean.length < 20) return { ok: false, content: clean, reason: "Kirjoita vähintään 20 merkkiä." };
  return { ok: true, content: clean, reason: null };
}

function scoreText(text: string) {
  const clean = String(text || "").trim();
  const lengthScore = Math.min(35, Math.round(clean.length / 12));
  const clarityScore = /koska|siksi|auttaa|tarvitsen|porukka|yhdessä|tukea/i.test(clean) ? 25 : 10;
  const structureScore = clean.includes(".") || clean.includes("!") || clean.includes("?") ? 20 : 10;
  const emotionScore = /kiitos|toivo|apua|huolehtii|yhteisö|perhe|ystävä/i.test(clean) ? 20 : 10;
  const score = Math.max(35, Math.min(100, lengthScore + clarityScore + structureScore + emotionScore));
  return {
    score,
    ai_score: score,
    ai_quality: Math.min(100, score + 3),
    ai_need: Math.min(100, Math.max(30, score - 5)),
    ai_clarity: Math.min(100, clarityScore * 3),
    ai_risk: 0,
    label: score >= 80 ? "Vahva perustelu" : score >= 60 ? "Hyvä alku" : "Paranna vielä",
  };
}

function detectMediaType(url: string, selectedType: string) {
  const clean = String(url || "").trim();
  if (!clean) return null;
  if (selectedType === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(clean)) return "video";
  return "image";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: "Server env missing: SUPABASE_URL, SUPABASE_ANON_KEY or SERVICE_ROLE_KEY" }, 500);
    }

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return json({ error: "Kirjaudu ensin sisään." }, 401);

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    if (userError || !userData?.user?.id) return json({ error: "Kirjautuminen ei ole voimassa." }, 401);

    // IMPORTANT: admin client must not inherit the user's Authorization header.
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json().catch(() => ({}));
    const checked = validatePostInput(body.content);
    if (!checked.ok) return json({ error: checked.reason }, 400);

    const userId = userData.user.id;
    const groupId = body.groupId || null;
    const mediaUrl = String(body.mediaUrl || "").trim();
    const mediaType = detectMediaType(mediaUrl, String(body.mediaType || "image"));
    const aiResult = scoreText(checked.content);

    const basePayload = {
      content: checked.content,
      user_id: userId,
      group_id: groupId,
      ai_score: aiResult.ai_score,
      ai_quality: aiResult.ai_quality,
      ai_need: aiResult.ai_need,
      ai_clarity: aiResult.ai_clarity,
      ai_risk: aiResult.ai_risk,
      ai_feedback: aiResult,
      votes: 0,
      views: 0,
      boost_score: 0,
      is_bot: false,
      paid_day_entry: false,
    };

    const payload = mediaUrl ? {
      ...basePayload,
      media_url: mediaUrl,
      media_type: mediaType,
      image_url: mediaType === "image" ? mediaUrl : null,
      video_url: mediaType === "video" ? mediaUrl : null,
      boost_score: Number(basePayload.boost_score || 0) + 5,
    } : basePayload;

    let insertedPost = null;
    const insert = await admin.from("posts").insert(payload).select("*").single();

    if (insert.error && mediaUrl) {
      console.warn("Media insert failed, retrying text-only post:", insert.error.message);
      const retry = await admin.from("posts").insert(basePayload).select("*").single();
      if (retry.error) throw retry.error;
      insertedPost = retry.data;
    } else if (insert.error) {
      throw insert.error;
    } else {
      insertedPost = insert.data;
    }

    await admin.from("user_events").insert({
      user_id: userId,
      post_id: insertedPost?.id || null,
      event_type: mediaType ? "media_post_created" : "post_created",
      source: "create-post-edge-function",
      meta: { media_type: mediaType || "text", version: "edge-create-post-v1" },
    });

    return json({ ok: true, post: insertedPost, ai: aiResult });
  } catch (error) {
    console.error("create-post failed", error);
    return json({ error: error?.message || "Postauksen lähetys epäonnistui." }, 500);
  }
});
