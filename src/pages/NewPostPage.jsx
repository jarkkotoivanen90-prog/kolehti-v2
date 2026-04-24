iimport { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function NewPostPage() {
  const [text, setText] = useState("");

  const createPost = async () => {
    const { data: user } = await supabase.auth.getUser();

    await supabase.from("posts").insert([
      {
        content: text,
        user_id: user.user.id,
      },
    ]);

    setText("");
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Uusi postaus</h1>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button onClick={createPost}>Postaa</button>
    </div>
  );
}
