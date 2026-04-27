// shortened for brevity but adding restriction inside submit

// inside handleSubmit before insert:

const lastPost = await supabase
  .from("posts")
  .select("created_at")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

if (lastPost.data) {
  const lastDate = new Date(lastPost.data.created_at);
  const now = new Date();
  const diff = now - lastDate;
  const week = 7 * 24 * 60 * 60 * 1000;

  if (diff < week) {
    alert("Voit postata vain kerran viikossa");
    setPosting(false);
    return;
  }
}
