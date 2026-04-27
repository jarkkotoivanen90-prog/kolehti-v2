import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function nowISO() {
  return new Date().toISOString();
}

async function getEvents(windowHours = 72) {
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("growth_events")
    .select("user_id,event_type,meta,created_at")
    .gte("created_at", since)
    .limit(5000);

  return data || [];
}

function extractSegment(meta) {
  return meta?.segment || meta?.type || "unknown";
}

function computeStats(events) {
  const stats = {};

  for (const e of events) {
    const segment = extractSegment(e.meta);
    if (!stats[segment]) {
      stats[segment] = {
        users: new Set(),
        events: 0,
        votes: 0,
        invites: 0,
        impressions: 0,
        notifications: 0,
      };
    }

    const s = stats[segment];
    s.events++;
    if (e.user_id) s.users.add(e.user_id);

    if (e.event_type.includes("vote")) s.votes++;
    if (e.event_type.includes("referral") || e.event_type.includes("invite")) s.invites++;
    if (e.event_type.includes("impression")) s.impressions++;
    if (e.event_type.includes("notification")) s.notifications++;
  }

  return stats;
}

function scoreSegment(s) {
  return (
    s.votes * 5 +
    s.invites * 10 +
    s.impressions * 1 +
    s.notifications * 2
  );
}

async function saveStats(stats, windowHours) {
  for (const key of Object.keys(stats)) {
    const s = stats[key];

    await supabase.from("segment_stats").insert({
      segment: key,
      window_hours: windowHours,
      users: s.users.size,
      events: s.events,
      votes: s.votes,
      invites: s.invites,
      impressions: s.impressions,
      notifications: s.notifications,
      score: scoreSegment(s),
      meta: {},
    });
  }
}

async function updateWeights(stats) {
  const totalScore = Object.values(stats).reduce((sum, s) => sum + scoreSegment(s), 0);

  if (!totalScore) return;

  const voteWeight = stats?.active ? scoreSegment(stats.active) / totalScore : 1;
  const inviteWeight = stats?.high_activity ? scoreSegment(stats.high_activity) / totalScore : 1;

  await supabase.from("optimizer_weights").upsert([
    {
      key: "vote_weight",
      value: voteWeight,
      reason: "Adjusted from recent engagement",
      updated_at: nowISO(),
    },
    {
      key: "invite_weight",
      value: inviteWeight,
      reason: "Adjusted from recent referral activity",
      updated_at: nowISO(),
    },
  ]);
}

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const windowHours = 72;
  const events = await getEvents(windowHours);
  const stats = computeStats(events);

  await saveStats(stats, windowHours);
  await updateWeights(stats);

  await supabase.from("optimizer_runs").insert({
    run_type: "scheduled",
    window_hours: windowHours,
    profiles_analyzed: 0,
    events_analyzed: events.length,
    summary: stats,
  });

  return res.json({ ok: true, events: events.length, segments: Object.keys(stats) });
}
