import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function NewPostPage() {
  const [content, setContent] = useState("");
  const [group, setGroup] = useState(null);
  const [user, setUser] = useState(null);
  const [ai, setAi] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    init();
  }, []);

  async function init() {
    setPageLoading(true);

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

    setPageLoading(false);
  }

  async function analyzeWithAI() {
    if (!content.trim() || content.trim().length < 20) {
      alert("Kirjoita ensin hieman pidempi perustelu.");
      return;
    }

    setAiLoading(true);
    setAi(null);

    const response = await fetch("/api/ai-mentor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: content }),
    });

    const data = await response.json();
    setAiLoading(false);

    if (!response.ok) {
      alert(data.error || "AI-analyysi epäonnistui.");
      return;
    }

    setAi(data);
  }

  function useImprovedText() {
    if (ai?.improved_text) {
      setContent(ai.improved_text);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!user) {
      alert("Kirjaudu ensin.");
      navigate("/login");
      return;
    }

    const groupId = localStorage.getItem("kolehti_group_id");

    if (!groupId) {
      alert("Valitse ensin porukka.");
      navigate("/groups");
      return;
    }

    if (!content.trim()) {
      alert("Kirjoita perustelu ensin.");
      return;
    }

    setPosting(true);

    const { error } = await supabase.from("posts").insert({
      content: content.trim(),
      user_id: user.id,
      group_id: groupId,
      ai_score: ai?.score || null,
      ai_feedback: ai || null,
      ai_improved_text: ai?.improved_text || null,
    });

    setPosting(false);

    if (error) {
      alert(error.message);
      return;
    }

    setContent("");
    navigate("/feed");
  }

  if (pageLoading) {
    return <div className="mx-auto max-w-3xl p-6 text-white">Ladataan...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl p-6 text-white">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Uusi perustelu</h1>
          <p className="mt-1 text-sm text-white/60">
            {group ? `Porukka: ${group.name}` : "Porukkaa ei ole valittu"}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/feed"
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold"
          >
            Feed
          </Link>

          <Link
            to="/groups"
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold"
          >
            Porukat
          </Link>
        </div>
      </div>

      {!group && (
        <div className="mb-5 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5">
          Valitse ensin porukka ennen postaamista.
          <Link to="/groups" className="ml-2 font-bold text-cyan-200">
            Mene porukkiin →
          </Link>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl"
      >
        <label className="text-sm font-bold text-cyan-200">
          Kirjoita perustelu
        </label>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Esim. Tarvitsen apua vuokraan..."
          className="mt-3 min-h-44 w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-white outline-none placeholder:text-white/40"
        />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-white/50">{content.length}/1000 merkkiä</p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={analyzeWithAI}
              disabled={aiLoading}
              className="rounded-2xl border border-cyan-300/20 bg-cyan-500/20 px-5 py-3 text-sm font-bold text-cyan-100 disabled:opacity-50"
            >
              {aiLoading ? "AI analysoi..." : "🤖 Analysoi AI:lla"}
            </button>

            <button
              type="submit"
              disabled={posting || !group}
              className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {posting ? "Lähetetään..." : "Postaa"}
            </button>
          </div>
        </div>
      </form>

      {ai && (
        <div className="mt-6 rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black">AI-mentor</h2>
              <p className="mt-1 text-sm text-white/60">{ai.summary}</p>
            </div>

            <div className="rounded-3xl bg-emerald-500/20 px-5 py-3 text-center">
              <div className="text-xs font-black text-emerald-200">SCORE</div>
              <div className="text-3xl font-black text-emerald-300">
                {ai.score}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <ScoreBox title="Selkeys" value={ai.clarity} />
            <ScoreBox title="Tunne" value={ai.emotion} />
            <ScoreBox title="Luottamus" value={ai.trust} />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4">
              <h3 className="font-black text-emerald-200">Vahvuudet</h3>
              <ul className="mt-2 space-y-1 text-sm text-white/75">
                {(ai.strengths || []).map((item, index) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-pink-300/20 bg-pink-500/10 p-4">
              <h3 className="font-black text-pink-200">Parannukset</h3>
              <ul className="mt-2 space-y-1 text-sm text-white/75">
                {(ai.improvements || []).map((item, index) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>

          {ai.improved_text && (
            <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-black text-cyan-200">Parannettu versio</h3>

                <button
                  onClick={useImprovedText}
                  className="rounded-xl bg-cyan-500 px-3 py-2 text-xs font-black"
                >
                  Käytä tätä
                </button>
              </div>

              <p className="text-sm leading-relaxed text-white/80">
                {ai.improved_text}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreBox({ title, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-xs font-black uppercase tracking-wide text-white/50">
        {title}
      </div>
      <div className="mt-2 text-3xl font-black text-cyan-200">{value}</div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
          style={{ width: `${Math.min(100, Math.max(0, value || 0))}%` }}
        />
      </div>
    </div>
  );
}
