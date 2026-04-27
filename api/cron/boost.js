import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .limit(50);

  if (!posts?.length) return res.json({ message: "no posts" });

  const random = posts[Math.floor(Math.random() * posts.length)];

  const ends = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await supabase.from("boost_events").insert({
    post_id: random.id,
    multiplier: 2,
    ends_at: ends,
    active: true
  });

  return res.json({ boosted: random.id });
}
