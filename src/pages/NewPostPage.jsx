import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function NewPostPage() {
  const [text, setText] = useState("");
  const nav = useNavigate();

  async function send() {
    const { data: { user } } = await supabase.auth.getUser();
    const groupId = localStorage.getItem("kolehti_group_id");

    await supabase.from("posts").insert({
      content: text,
      user_id: user.id,
      group_id: groupId
    });

    nav("/feed");
  }

  return (
    <div className="p-6 text-white">
      <textarea value={text} onChange={e => setText(e.target.value)} />
      <button onClick={send}>Postaa</button>
    </div>
  );
}
