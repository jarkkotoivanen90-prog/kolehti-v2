import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import AdaptiveBackground from "../components/AdaptiveBackground";
import { haptic } from "../lib/effects";
import { validatePostInput, normalizePostForInsert, logClientError } from "../lib/postSafety";

const BG = "https://commons.wikimedia.org/wiki/Special:FilePath/Ikaalinen_-_lake_and_forest.jpg?width=1200";

function scoreText(text) {
  const clean = String(text || "").trim();
  const lengthScore = Math.min(35, Math.round(clean.length / 12));
  const clarityScore = /koska|siksi|auttaa|tarvitsen|porukka|yhdessa|yhdessä|tukea/i.test(clean) ? 25 : 10;
  const structureScore = /[.!?]/.test(clean) ? 20 : 10;
  const emotionScore = /kiitos|toivo|apua|yhteiso|yhteisö|perhe|ystava|ystävä/i.test(clean) ? 20 : 10;
  const score = Math.max(35, Math.min(100, lengthScore + clarityScore + structureScore + emotionScore));
  return {
    score,
    ai_score: score,
    ai_quality: Math.min(100, score + 3),
    ai_need: Math.min(100, Math.max(30, score - 5)),
    ai_clarity: Math.min(100, clarityScore * 3),
    ai_risk: 0,
    label: score >= 80 ? "Vahva perustelu" : score >= 60 ? "Hyvä alku" : "Paranna vielä",
    tip: score >= 80 ? "Tämä on selkeä ja uskottava perustelu." : "Lisää yksi konkreettinen syy: miksi juuri tätä pitäisi tukea?",
  };
}

function detectMediaType(url, selectedType) {
  const clean = String(url || "").trim();
  if (!clean) return null;
  if (selectedType === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(clean)) return "video";
  return "image";
}

export default function NewPostPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [posting, setPosting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUser(data?.user || null);
    });
    return () => { mounted = false; };
  }, []);

  const validation = useMemo(() => validatePostInput(content), [content]);
  const aiPreview = useMemo(() => scoreText(content), [content]);
  const cleanMediaUrl = String(mediaUrl || "").trim();
  const resolvedMediaType = detectMediaType(cleanMediaUrl, mediaType);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!user) {
      navigate("/login");
      return;
    }

    const checked = validatePostInput(content);
    if (!checked.ok) {
      setErrorMessage(checked.reason || "Tarkista perustelu.");
      return;
    }

    setPosting(true);

    try {
      const groupId = localStorage.getItem("kolehti_group_id");
      const aiResult = scoreText(checked.content);
      const basePayload = normalizePostForInsert({ content: checked.content, user, groupId, aiResult });
      const payload = cleanMediaUrl ? {
        ...basePayload,
        media_url: cleanMediaUrl,
        media_type: resolvedMediaType,
        image_url: resolvedMediaType === "image" ? cleanMediaUrl : null,
        video_url: resolvedMediaType === "video" ? cleanMediaUrl : null,
        boost_score: Number(basePayload.boost_score || 0) + 5,
      } : basePayload;

      const { error } = await supabase.from("posts").insert(payload);
      if (error && cleanMediaUrl) {
        const retry = await supabase.from("posts").insert(basePayload);
        if (retry.error) throw retry.error;
      } else if (error) {
        throw error;
      }

      await supabase.from("user_events").insert({
        user_id: user.id,
        event_type: resolvedMediaType ? "media_post_created" : "post_created",
        source: "new_post",
        meta: { media_type: resolvedMediaType || "text" },
      });

      setContent("");
      setMediaUrl("");
      setSuccessMessage("Postaus julkaistu.");
      haptic("success");
      setTimeout(() => navigate("/feed"), 900);
    } catch (err) {
      await logClientError(supabase, {
        source: "new_post_direct_hotfix",
        message: err?.message || "Postauksen lähetys epäonnistui.",
        user_id: user?.id,
      });
      setErrorMessage(err?.message || "Postauksen lähetys epäonnistui.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#050816] px-4 pb-[170px] pt-8 text-white">
      <AdaptiveBackground src={BG} strength="balanced" />
      <main className="relative z-10 mx-auto max-w-md">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100/62">Uusi entry</p>
        <h1 className="mt-2 text-[44px] font-black leading-none tracking-tight">Uusi postaus</h1>
        <p className="mt-2 text-sm font-bold text-cyan-100/70">Kirjoita perustelu ja julkaise feediin.</p>

        <form onSubmit={handleSubmit} className="relative mt-6 overflow-hidden rounded-[34px] border border-cyan-200/20 bg-[#041226]/78 p-5 text-white shadow-2xl shadow-cyan-500/10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,.14),transparent_45%)]" />
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Miksi juuri tätä pitäisi tukea?"
              maxLength={1000}
              className="min-h-[220px] w-full resize-none rounded-[24px] border border-cyan-100/10 bg-white/[.055] p-5 text-lg font-bold text-white outline-none placeholder:text-white/35"
            />

            <div className="mt-3 flex items-center justify-between text-xs font-black text-white/55">
              <span>{content.length}/1000</span>
              <span>AI {aiPreview.score} · {aiPreview.label}</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setMediaType("image")} className={`rounded-2xl px-4 py-3 font-black ${mediaType === "image" ? "bg-cyan-500" : "bg-white/[.055]"}`}>Kuva</button>
              <button type="button" onClick={() => setMediaType("video")} className={`rounded-2xl px-4 py-3 font-black ${mediaType === "video" ? "bg-cyan-500" : "bg-white/[.055]"}`}>Video</button>
            </div>

            <input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="Kuvan tai videon URL (valinnainen)"
              className="mt-3 w-full rounded-[22px] border border-cyan-100/10 bg-white/[.055] px-4 py-4 font-bold text-white outline-none placeholder:text-white/35"
            />

            <p className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-500/10 px-4 py-3 text-sm font-bold text-cyan-50/80">{aiPreview.tip}</p>

            {errorMessage && <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm font-black text-red-100">{errorMessage}</div>}
            {successMessage && <div className="mt-4 rounded-2xl border border-green-400/30 bg-green-500/15 px-4 py-3 text-sm font-black text-green-100">{successMessage}</div>}

            <button type="submit" disabled={posting || !validation.ok} className="mt-5 w-full rounded-[28px] bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-5 text-xl font-black text-white shadow-2xl shadow-cyan-500/25 disabled:opacity-40">
              {posting ? "Julkaistaan..." : "Julkaise"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
