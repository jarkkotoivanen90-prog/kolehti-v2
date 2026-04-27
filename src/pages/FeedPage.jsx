// imports
import { getUserSegment } from "../lib/userSegment";
import { sendSegmentMessage } from "../lib/segmentMessages";

// inside loadFeed after segment insert
const segment = getUserSegment(profileData);

await supabase.from("growth_events").insert({
  user_id: user.id,
  event_type: "user_segment",
  source: "feed",
  meta: segment,
});

await sendSegmentMessage({
  user,
  profile: profileData,
  segment,
  posts: optimizedFeed,
});
