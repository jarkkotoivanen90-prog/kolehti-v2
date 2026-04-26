import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { analyzePostWithAI } from "../lib/ai";

export default function NewPostPage() {
  const [content, setContent] = useState("");
  const [group, setGroup] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user || null);

    const groupId = localStorage.getItem("kolehti_group_id");

    if (groupId) {
      const { data } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

      setGroup(data || null);
    }

    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!user) {
      navigate("/login");
      return;
    }

    const groupId = localStorage.getItem("kolehti_group_id");

    if (!groupId) {
      alert("Valitse ensin porukka.");
      navigate("/groups");
      return;
    }

    if (content.trim().length < 20) {
      alert("Kirjoita vähintään 20 merkkiä.");
      return;
    }

    setPosting(true);

    try {
      const aiResult = await analyzePostWithAI(content.trim());
      setAiPreview(aiResult);

      const { error } = await supabase.from("posts").insert({
        content: content.trim(),
        user_id: user.id,
        group_id: groupId,
        ai_score: aiResult.ai_score || aiResult.score || 0,
        ai_feedback: aiResult,
      });

      if (error) throw error;

      setContent("");
      navigate("/feed");
    } catch (err) {
      alert(err.message || "Postauksen lähetys epäonnistui.");
    } finally {
      setPosting(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-[#050816] p-6 text-white">Ladataan...</div>;
  }

  return (
    <div className="min-h-screen bg-[#050816] px-4 py-6 pb-32 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#153b92_0%,#050816_45%,#02030a_100%)]" />

      <main className="mx-auto max-w-2xl">
        <header className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-4xl font-black">Uusi perustelu</h1>
            <p className="mt-1 text-sm font-bold text-white/55">
              {group ? `Porukka: ${group.name}` : "Ei valittua porukkaa"}
            </p>
          </div>

          <Link
            to="/feed"
            className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 font-black"
          >
            Feed
          </Link>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-[34px] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl"
        >
          <label className="text-sm font-black uppercase tracking-wide text-cyan-200">
            Kerro perustelusi
          </label>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Kirjoita miksi juuri sinun perustelusi pitäisi nousta esiin..."
            className="mt-3 min-h-56 w-full resize-none rounded-3xl border border-white/10 bg-black/30 p-5 text-lg font-bold leading-relaxed text-white outline-none placeholder:text-white/35"
          />

          <div className="mt-3 flex items-center justify-between text-xs font-black text-white/45">
            <span>{content.length}/1000 merkkiä</span>
            <span>AI arvioi ennen julkaisua</span>
          </div>

          <button
            type="submit"
            disabled={posting}
            className="mt-5 w-full rounded-3xl bg-cyan-500 px-5 py-5 text-xl font-black text-white shadow-2xl shadow-cyan-500/25 disabled:opacity-50"
          >
            {posting ? "🤖 AI analysoi..." : "Lähetä perustelu"}
          </button>
        </form>

        {aiPreview && (
          <div className="mt-5 rounded-[30px] border border-cyan-300/20 bg-cyan-500/10 p-5 shadow-xl">
            <h2 className="text-xl font-black text-cyan-200">AI-analyysi</h2>
            <p className="mt-2 text-sm text-white/70">
              Score: {Math.round(aiPreview.ai_score || aiPreview.score || 0)}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
