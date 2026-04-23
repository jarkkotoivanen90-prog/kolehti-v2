import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "./useAuth";

export function useCreatePost() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function createPost({ title, body }) {
    if (!user) {
      throw new Error("Kirjaudu ensin");
    }

    setSubmitting(true);
    setError("");

    try {
      const { data, error: insertError } = await supabase
        .from("posts")
        .insert({
          profile_id: user.id,
          title: title || "",
          body,
          votes: 0,
          ai_score: 0,
          audience_fit_score: 0,
          hook_score: 0,
          feed_score: 0,
          boost_count: 0,
          boost_visibility: 0,
          status: "active",
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    } catch (err) {
      setError(err.message || "Postauksen luonti epäonnistui");
      throw err;
    } finally {
      setSubmitting(false);
    }
  }

  return {
    createPost,
    submitting,
    error,
  };
}
