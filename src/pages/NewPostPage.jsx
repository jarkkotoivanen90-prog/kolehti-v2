import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { analyzePostWithAI } from "../lib/ai";
import { rewardPost } from "../lib/progression";
import { improvePost } from "../lib/creatorAI";

export default function NewPostPage() {
  const [content, setContent] = useState("");
  const [improvedDraft, setImprovedDraft] = useState("");
  const [tips, setTips] = useState([]);
  const [group, setGroup] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [improving, setImproving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);
  const navigate = useNavigate();

  const score = Math.round(aiPreview?.ai_score || aiPreview?.score || 0);
  const quality = Math.round(aiPreview?.ai_quality || 0);
  const need = Math.round(aiPreview?.ai_need || 0);
  const clarity = Math.round(aiPreview?.ai_clarity || 0);
  const risk = Math.round(aiPreview?.ai_risk || 0);

  const creatorStatus = useMemo(() => {
    if (!content.trim()) return "Kirjoita perustelu ja julkaise heti.";
    if (content.trim().length < 60) return "Lisää vielä konkreettinen syy.";
    if (score >= 80) return "Valmis julkaisuun 🔥";
    if (score >= 60) return "Hyvä pohja — AI voi vielä hioa.";
    return "Creator AI voi vahvistaa tätä.";
  }, [content, score]);

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

  async function handleImprove() {
    if (!content.trim()) return;

    setImproving(true);
    const res = await improvePost(content);
    setImprovedDraft(res.improved || "");
    setTips(res.tips || []);
    setImproving(false);
  }

  function useImprovedDraft() {
    if (!improvedDraft) return;
    setContent(improvedDraft);
    setImprovedDraft("");
    setAiPreview(null);
  }

  async function handleAnalyze() {
    if (content.trim().length < 20) return;

    setAnalyzing(true);
    const result = await analyzePostWithAI(content.trim());
    setAiPreview(result);
    setAnalyzing(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!user) {
      navigate("/login");
      return;
    }

    if (content.trim().length < 20) {
      alert("Kirjoita vähintään 20 merkkiä.");
      return;
    }

    setPosting(true);

    try {
      const groupId = localStorage.getItem("kolehti_group_id");
      const aiResult = aiPreview || (await analyzePostWithAI(content.trim()));
      setAiPreview(aiResult);

      const { error } = await supabase.from("posts").insert({
        content: content.trim(),
        user_id: user.id,
        group_id: groupId || null,
        ai_score: aiResult.ai_score || aiResult.score || 50,
        ai_quality: aiResult.ai_quality || 50,
        ai_need: aiResult.ai_need || 50,
        ai_clarity: aiResult.ai_clarity || 50,
        ai_risk: aiResult.ai_risk || 0,
        ai_feedback: aiResult,
        votes: 0,
        views: 0,
        boost_score: 0,
        is_bot: false,
        paid_day_entry: false,
      });

      if (error) throw error;

      await rewardPost(user.id);

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
            <p className="text-sm font-black uppercase tracking-wide text-purple-200">Creator AI</p>
            <h1 className="text-4xl font-black">Uusi perustelu</h1>
            <p className="mt-1 text-sm font-bold text-white/55">
              {group ? `Porukka: ${group.name}` : "Voit julkaista heti"}
            </p>
          </div>

          <Link to="/feed" className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 font-black">
            Feed
          </Link>
        </header>

        <div className="mb-4 rounded-[30px] border border-purple-300/20 bg-purple-500/10 p-5 shadow-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-black text-purple-200">🤖 AI status</div>
              <div className="mt-1 text-xl font-black">{creatorStatus}</div>
            </div>
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-black/30 text-3xl font-black text-cyan-200">
              {score || "--"}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[34px] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
          <label className="text-sm font-black uppercase tracking-wide text-cyan-200">Kerro perustelusi</label>

          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setAiPreview(null);
            }}
            placeholder="Kirjoita miksi juuri sinun perustelusi pitäisi nousta esiin..."
            className="mt-3 min-h-56 w-full resize-none rounded-3xl border border-white/10 bg-black/30 p-5 text-lg font-bold leading-relaxed text-white outline-none placeholder:text-white/35"
          />

          <div className="mt-3 grid grid-cols-2 gap-3">
            <button type="button" onClick={handleImprove} disabled={improving || content.trim().length < 5} className="rounded-2xl bg-purple-500 px-4 py-4 font-black text-white disabled:opacity-50">
              {improving ? "🤖 Parannetaan..." : "🤖 Paranna"}
            </button>

            <button type="button" onClick={handleAnalyze} disabled={analyzing || content.trim().length < 20} className="rounded-2xl bg-white/10 px-4 py-4 font-black text-white disabled:opacity-50">
              {analyzing ? "Analysoi..." : "📊 Score"}
            </button>
          </div>

          {improvedDraft && (
            <div className="mt-4 rounded-3xl border border-purple-300/20 bg-black/30 p-4">
              <div className="text-sm font-black text-purple-200">AI ehdotus</div>
              <p className="mt-2 whitespace-pre-wrap text-sm font-bold text-white/75">{improvedDraft}</p>
              <button type="button" onClick={useImprovedDraft} className="mt-3 rounded-2xl bg-purple-400 px-4 py-3 font-black text-black">
                Käytä tätä versiota
              </button>
            </div>
          )}

          {tips.length > 0 && (
            <div className="mt-3 rounded-2xl bg-white/5 p-4 text-sm font-bold text-white/70">
              <div className="mb-2 font-black text-cyan-200">AI vinkit</div>
              {tips.map((t, i) => <div key={i}>• {t}</div>)}
            </div>
          )}

          {aiPreview && (
            <div className="mt-4 rounded-3xl border border-cyan-300/20 bg-cyan-500/10 p-4">
              <div className="mb-3 text-sm font-black text-cyan-200">AI scorecard</div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-black">
                <ScoreBox label="Laatu" value={quality} />
                <ScoreBox label="Tarve" value={need} />
                <ScoreBox label="Selkeys" value={clarity} />
                <ScoreBox label="Riski" value={risk} />
              </div>
              {aiPreview.summary && <p className="mt-3 text-sm font-bold text-white/65">{aiPreview.summary}</p>}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between text-xs font-black text-white/45">
            <span>{content.length}/1000 merkkiä</span>
            <span>Ei postauslimittiä</span>
          </div>

          <button type="submit" disabled={posting} className="mt-5 w-full rounded-3xl bg-cyan-500 px-5 py-5 text-xl font-black text-white shadow-2xl shadow-cyan-500/25 disabled:opacity-50">
            {posting ? "🤖 AI analysoi..." : "Lähetä perustelu"}
          </button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
}

function ScoreBox({ label, value }) {
  return (
    <div className="rounded-2xl bg-black/25 p-3">
      <div className="text-lg font-black text-white">{value}</div>
      <div className="text-[10px] text-white/45">{label}</div>
    </div>
  );
}

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md rounded-t-[30px] border border-white/10 bg-[#061126]/95 px-4 pb-4 pt-3 text-white shadow-2xl backdrop-blur-xl">
      <div className="grid grid-cols-5 items-end text-center text-xs font-black">
        <Link to="/">🏠<div>Koti</div></Link>
        <Link to="/feed">🔥<div>Feed</div></Link>
        <Link to="/new" className="-mt-8 text-cyan-300">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blue-500 text-5xl shadow-2xl shadow-blue-500/40">+</div>
          <div>Uusi</div>
        </Link>
        <Link to="/pots">🏆<div>Potit</div></Link>
        <Link to="/profile">👤<div>Profiili</div></Link>
      </div>
    </nav>
  );
}
