import { supabase } from "./supabaseClient";
import { createNotification } from "./notifications";

function dayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function eventExistsToday(userId, eventType) {
  const day = dayKey();

  const { data } = await supabase
    .from("growth_events")
    .select("id")
    .eq("user_id", userId)
    .eq("event_type", eventType)
    .gte("created_at", `${day}T00:00:00.000Z`)
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}

async function saveEvent(userId, eventType, meta = {}) {
  await supabase.from("growth_events").insert({
    user_id: userId,
    event_type: eventType,
    source: "segment_messages",
    points: 0,
    meta,
  });
}

function topPost(posts = []) {
  if (!posts.length) return null;

  return [...posts].sort((a, b) => {
    const aScore = Number(a.vote_count || a.votes || 0) * 100 + Number(a.ai_score || 0) + Number(a.boost_score || 0);
    const bScore = Number(b.vote_count || b.votes || 0) * 100 + Number(b.ai_score || 0) + Number(b.boost_score || 0);
    return bScore - aScore;
  })[0];
}

function ownTopPost(posts = [], userId) {
  return topPost(posts.filter((post) => post.user_id === userId));
}

export async function sendSegmentMessage({ user, profile, segment, posts = [] }) {
  if (!user?.id || !segment?.segment) return null;

  const userId = user.id;
  const segmentName = segment.segment;
  const bestPost = topPost(posts);
  const ownPost = ownTopPost(posts, userId);
  const eventType = `segment_message_${segmentName}_${dayKey()}`;

  if (await eventExistsToday(userId, eventType)) return null;

  let title = "✨ Kolehti";
  let body = "Käy katsomassa mitä porukassa tapahtuu.";

  if (segmentName === "returning") {
    title = "👋 Tervetuloa takaisin";
    body = bestPost
      ? "Feedissä on uusi kärkipostaus. Käy katsomassa tilanne."
      : "Porukassa on uutta liikettä. Käy katsomassa feedi.";
  }

  if (segmentName === "casual") {
    title = "✨ Yksi ääni riittää alkuun";
    body = "Anna yksi ääni ja nosta porukan aktiivisuutta. Saat samalla XP:tä.";
  }

  if (segmentName === "active") {
    title = "🔥 Ranking elää nyt";
    body = ownPost
      ? "Oma postauksesi on mukana kilpailussa. Pieni aktiivisuus voi nostaa sitä."
      : "Nouse leaderboardissa: äänestä, kutsu tai luo uusi perustelu.";
  }

  if (segmentName === "high_activity") {
    title = "🚀 Sinä vedät kasvua";
    body = "Kutsulinkki ja aktiivisuus vaikuttavat leaderboardiin. Nyt on hyvä hetki jatkaa.";
  }

  await createNotification({
    userId,
    type: `segment_${segmentName}`,
    title,
    body,
    meta: {
      segment: segmentName,
      top_post_id: bestPost?.id || null,
      own_post_id: ownPost?.id || null,
      referral_count: profile?.referral_count || 0,
      growth_score: profile?.growth_score || 0,
    },
  });

  await saveEvent(userId, eventType, {
    segment,
    top_post_id: bestPost?.id || null,
    own_post_id: ownPost?.id || null,
  });

  return { sent: true, segment: segmentName };
}
