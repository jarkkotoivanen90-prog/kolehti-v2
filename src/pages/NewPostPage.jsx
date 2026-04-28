// UPDATED VERSION WITH SAFETY LAYER
import { validatePostInput, normalizePostForInsert, logClientError } from "../lib/postSafety";

// ... keep everything same until handleSubmit

async function handleSubmit(e) {
  e.preventDefault();

  if (!user) {
    navigate("/login");
    return;
  }

  setPosting(true);

  try {
    const groupId = localStorage.getItem("kolehti_group_id");

    const validation = validatePostInput(content);
    if (!validation.ok) {
      alert(validation.reason);
      return;
    }

    const aiResult = aiPreview || (await analyzePostWithAI(validation.content));

    const payload = normalizePostForInsert({
      content: validation.content,
      user,
      groupId,
      aiResult,
    });

    const { error } = await supabase.from("posts").insert(payload);

    if (error) throw error;

    await rewardPost(user.id);

    setContent("");
    navigate("/feed");
  } catch (err) {
    await logClientError(supabase, {
      source: "new_post",
      message: err.message,
      details: { content },
      user_id: user?.id,
    });

    alert(err.message || "Postauksen lähetys epäonnistui.");
  } finally {
    setPosting(false);
  }
}
