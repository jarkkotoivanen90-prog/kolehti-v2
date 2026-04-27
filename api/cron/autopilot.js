import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function hoursSince(date) {
  if (!date) return 999;
  return (Date.now() - new Date(date).getTime()) / 1000 / 60 / 60;
}

function getSegment(profile = {}) {
  const lastSeenHours = hoursSince(profile.last_seen_at);
  const streak = Number(profile.user_streak || 0);
  const referrals = Number(profile.referral_count || 0);
  const growthScore = Number(profile.growth_score || 0);
  const votes = Number(profile.total_votes_given || 0);
  const posts = Number(profile.total_posts_created || 0);

  const score = Math.round(
    streak * 10 + referrals * 20 + growthScore * 0.15 + votes * 3 + posts * 8 - Math.min(120, lastSeenHours * 4)
  );

  if (lastSeenHours > 24) return { segment: "returning", score, lastSeenHours };
  if (score >= 180) return { segment: "high_activity", score, lastSeenHours };
  if (score >= 70) return { segment: "active", score, lastSeenHours };
  return { segment: "casual", score, lastSeenHours };
}

function getMessage(segment, topPost) {
  if (segment === "returning") {
    return {
      type: "autopilot_returning",
      title: "👋 Tervetuloa takaisin",
      body: topPost
        ? "Feedissä on uusi kärkipostaus. Käy katsomassa tilanne."
        : "Porukassa on uutta liikettä. Käy katsomassa feedi.",
    };
  }

  if (segment === "casual") {
    return {
      type: "autopilot_casual",
      title: "✨ Yksi ääni riittää alkuun",
      body: "Anna yksi ääni ja nosta porukan aktiivisuutta. Saat samalla XP:tä.",
    };
  }

  if (segment === "active") {
    return {
      type: "autopilot_active",
      title: "🔥 Ranking elää nyt",
      body: "Nouse leaderboardissa: äänestä, kutsu tai luo uusi perustelu.",
    };
  }

  return {
    type: "autopilot_high_activity",
    title: "🚀 Sinä vedät kasvua",
    body: "Kutsulinkki ja aktiivisuus vaikuttavat leaderboardiin. Nyt on hyvä hetki jatkaa.",
  };
}

async function alreadySentToday(userId, type) {
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("growth_events")
    .select("id")
    .eq("user_id", userId)
    .eq("event_type", type)
    .gte("created_at", `${today}T00:00:00.000Z`)
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}

async function getTopPost() {
  const { data } = await supabase
    .from("posts")
    .select("id,content,votes,ai_score,boost_score,created_at,hidden")
    .eq("hidden", false)
    .order("boost_score", { ascending: false })
    .limit(10);

  if (!data?.length) return null;

  return [...data].sort((a, b) => {
    const scoreA = Number(a.votes || 0) * 100 + Number(a.ai_score || 0) + Number(a.boost_score || 0);
    const scoreB = Number(b.votes || 0) * 100 + Number(b.ai_score || 0) + Number(b.boost_score || 0);
    return scoreB - scoreA;
  })[0];
}

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "unauthorized" });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "missing_supabase_env" });
  }

  const topPost = await getTopPost();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id,last_seen_at,user_streak,referral_count,growth_score,total_votes_given,total_posts_created")
    .limit(200);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const results = [];

  for (const profile of profiles || []) {
    const segment = getSegment(profile);
    const message = getMessage(segment.segment, topPost);
    const eventType = `${message.type}_${new Date().toISOString().slice(0, 10)}`;

    if (await alreadySentToday(profile.id, eventType)) {
      results.push({ user_id: profile.id, skipped: true, reason: "already_sent" });
      continue;
    }

    await supabase.from("notifications").insert({
      user_id: profile.id,
      type: message.type,
      title: message.title,
      body: message.body,
      meta: {
        segment,
        top_post_id: topPost?.id || null,
        source: "autopilot_cron",
      },
    });

    await supabase.from("growth_events").insert({
      user_id: profile.id,
      event_type: eventType,
      source: "autopilot_cron",
      points: 0,
      meta: {
        segment,
        top_post_id: topPost?.id || null,
      },
    });

    results.push({ user_id: profile.id, sent: true, segment: segment.segment });
  }

  return res.json({ ok: true, processed: results.length, results });
}
