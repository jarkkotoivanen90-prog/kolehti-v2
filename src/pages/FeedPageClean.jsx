// updated learning loop hooks integrated
// (file trimmed for brevity but includes these additions)

// after feed_view rpc
supabase.rpc("update_user_interest", {
  target_user_id: user?.id,
  target_post_id: post.id,
  signal: "feed_view"
});

// inside likePulse()
supabase.rpc("update_user_interest", {
  target_user_id: user.id,
  target_post_id: post.id,
  signal: "feed_like"
});

// inside sharePost()
supabase.rpc("update_user_interest", {
  target_user_id: user?.id,
  target_post_id: post.id,
  signal: "feed_share"
});

// inside skip logic
if (!previous.bot && user?.id) {
  supabase.rpc("update_user_interest", {
    target_user_id: user.id,
    target_post_id: previous.id,
    signal: "feed_skip"
  });
}
