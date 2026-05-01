// UPDATED TO USE EDGE FUNCTION
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import AppBottomNav from "../components/AppBottomNav";
import { haptic } from "../lib/effects";
import { validatePostInput, logClientError } from "../lib/postSafety";

export default function NewPostPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [posting, setPosting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage("");

    if (!user) {
      navigate("/login");
      return;
    }

    const checked = validatePostInput(content);
    if (!checked.ok) {
      setErrorMessage(checked.reason);
      return;
    }

    setPosting(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-post", {
        body: {
          content,
          mediaUrl,
          mediaType,
          groupId: localStorage.getItem("kolehti_group_id"),
        },
      });

      if (error) throw error;

      setContent("");
      setMediaUrl("");
      haptic("success");
      setTimeout(() => navigate("/feed"), 1000);
    } catch (err) {
      await logClientError(supabase, {
        source: "edge_post",
        message: err?.message,
      });
      setErrorMessage(err?.message || "Virhe postauksessa");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit}>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} />
        <input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} />
        <button disabled={posting}>Julkaise</button>
      </form>
      {errorMessage && <div>{errorMessage}</div>}
    </div>
  );
}
