import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function NewPostPage() {
  const [content, setContent] = useState("");
  const navigate = useNavigate();

  const handlePost = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Et ole kirjautunut");
      return;
    }

    const { error } = await supabase.from("posts").insert([
      {
        content,
        user_id: user.id,
      },
    ]);

    if (error) {
      alert(error.message);
    } else {
      setContent("");
      navigate("/feed");
    }
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl mb-4">Uusi postaus</h1>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full p-3 rounded bg-white/10 mb-4"
        placeholder="Kirjoita perustelu..."
      />

      <button
        onClick={handlePost}
        className="px-4 py-2 bg-cyan-500 rounded"
      >
        Lähetä
      </button>
    </div>
  );
}
