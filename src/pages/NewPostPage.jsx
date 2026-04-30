import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import AppBottomNav from "../components/AppBottomNav";
import { haptic } from "../lib/effects";
import {
  validatePostInput,
  normalizePostForInsert,
  logClientError,
} from "../lib/postSafety";

const VERSION = "NEW POST MEDIA SAFE 2026-04-29";
const BG = "https://commons.wikimedia.org/wiki/Special:FilePath/Finnish_lake_and_forest_landscape_(175928795).jpg?width=1200";

function scoreText(text) {
  const clean = String(text || "").trim();
  const lengthScore = Math.min(35, Math.round(clean.length / 12));
  const clarityScore = /koska|siksi|auttaa|tarvitsen|porukka|yhdessä|tukea/i.test(clean) ? 25 : 10;
  const structureScore = clean.includes(".") || clean.includes("!") || clean.includes("?") ? 20 : 10;
  const emotionScore = /kiitos|toivo|apua|huolehtii|yhteisö|perhe|ystävä/i.test(clean) ? 20 : 10;
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

async function rewardPostSafely(userId, mediaType) {
  if (!userId) return;
  try {
    await supabase.from("user_events").insert({
      user_id: userId,
      event_type: mediaType ? "media_post_created" : "post_created",
      source: "new_post",
      meta: { version: VERSION, media_type: mediaType || "text" },
    });
  } catch (error) {
    console.warn("rewardPostSafely fallback:", error);
  }
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
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (mounted) setUser(data?.user || null);
    }
    loadUser();
    return () => { mounted = false; };
  }, []);

  const validation = useMemo(() => validatePostInput(content), [content]);
  const aiPreview = useMemo(() => scoreText(content), [content]);
  const remaining = Math.max(0, 1000 - String(content || "").length);
  const cleanMediaUrl = String(mediaUrl || "").trim();
  const resolvedMediaType = detectMediaType(cleanMediaUrl, mediaType);

  async function handleSubmit(e) {
    e.preventDefault();
    haptic("success");
    setErrorMessage("");
    setSuccessMessage("");

    if (!user) {
      navigate("/login");
      return;
    }

    const checked = validatePostInput(content);
    if (!checked.ok) {
      haptic("warning");
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
        console.warn("Media columns may be missing, retrying text-only insert:", error);
        const retry = await supabase.from("posts").insert(basePayload);
        if (retry.error) throw retry.error;
      } else if (error) throw error;

      await rewardPostSafely(user.id, resolvedMediaType);
      setContent("");
      setMediaUrl("");
      setSuccessMessage(cleanMediaUrl ? "Media-postaus julkaistu." : "Perustelu julkaistu.");
      haptic("heavy");
      navigate("/feed");
    } catch (err) {
      await logClientError(supabase, {
        source: "new_post_media",
        message: err?.message || "Postauksen lähetys epäonnistui.",
        details: { content: String(content || "").slice(0, 250), mediaUrl: cleanMediaUrl },
        user_id: user?.id,
      });
      haptic("warning");
      setErrorMessage(err?.message || "Postauksen lähetys epäonnistui.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#050816] text-white">
      <img src={BG} alt="" className="fixed inset-0 h-full w-full object-cover" loading="eager" decoding="async" />
      <div className="fixed inset-0 bg-gradient-to-b from-black/35 via-[#061126]/70 to-black/94" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,.18),transparent_36%)]" />

      <main className="relative z-10 mx-auto max-w-md px-4 pb-[170px] pt-6">
        <header>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200/78">🇫🇮 Suomi · uusi perustelu</p>
              <h1 className="mt-2 text-[44px] font-black leading-none tracking-tight">Uusi postaus</h1>
            </div>
            <Link data-haptic="tap" to="/feed" className="rounded-2xl border border-white/15 bg-black/28 px-4 py-3 text-sm font-black text-white/85 backdrop-blur-xl">
              Feed
            </Link>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="mt-6 rounded-[34px] border border-white/15 bg-black/42 p-5 shadow-2xl shadow-black/35 backdrop-blur-2xl">
          <label className="text-sm font-black uppercase tracking-wide text-cyan-200">Kerro perustelusi</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Kirjoita selkeä perustelu. Miksi juuri tätä pitäisi tukea?"
            className="mt-4 min-h-[220px] w-full resize-none rounded-[28px] border border-white/12 bg-black/38 p-5 text-lg font-bold leading-relaxed text-white outline-none placeholder:text-white/30 focus:border-cyan-300/60"
            maxLength={1000}
          />

          <div className="mt-3 flex items-center justify-between text-xs font-black text-white/55">
            <span>{content.length}/1000 merkkiä</span>
            <span>{remaining} jäljellä</span>
          </div>

          <section className="mt-5 rounded-[26px] border border-pink-300/20 bg-black/32 p-4 backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-wide text-pink-200">Kuva tai video feediin</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button data-haptic="tap" type="button" onClick={() => { haptic("tap"); setMediaType("image"); }} className={`rounded-2xl px-4 py-3 text-sm font-black ${mediaType === "image" ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20" : "bg-black/35 text-white/65"}`}>🖼️ Kuva</button>
              <button data-haptic="tap" type="button" onClick={() => { haptic("tap"); setMediaType("video"); }} className={`rounded-2xl px-4 py-3 text-sm font-black ${mediaType === "video" ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20" : "bg-black/35 text-white/65"}`}>🎥 Video</button>
            </div>
            <input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="Liitä kuvan tai videon URL"
              className="mt-3 w-full rounded-[22px] border border-white/12 bg-black/38 px-4 py-4 text-sm font-bold text-white outline-none placeholder:text-white/30 focus:border-pink-300/60"
            />
            {cleanMediaUrl && (
              <div className="mt-3 overflow-hidden rounded-[24px] border border-white/10 bg-black/35">
                {resolvedMediaType === "video" ? <video src={cleanMediaUrl} className="max-h-72 w-full object-cover" muted loop playsInline controls /> : <img src={cleanMediaUrl} alt="Media preview" className="max-h-72 w-full object-cover" loading="lazy" decoding="async" />}
              </div>
            )}
            <p className="mt-3 text-xs font-bold leading-relaxed text-white/58">Kuva tai video näkyy TikTok-tyylisessä feedissä koko ruudun taustana.</p>
          </section>

          <section className="mt-5 rounded-[26px] border border-cyan-300/20 bg-cyan-500/10 p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-cyan-200">AI score</p>
                <p className="mt-1 text-sm font-bold text-white/65">{aiPreview.label}</p>
              </div>
              <div className="text-4xl font-black text-cyan-200">{aiPreview.score}</div>
            </div>
            <p className="mt-3 text-sm font-bold leading-relaxed text-white/65">{aiPreview.tip}</p>
          </section>

          {errorMessage && <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm font-black text-red-100">{errorMessage}</div>}
          {successMessage && <div className="mt-4 rounded-2xl border border-green-400/30 bg-green-500/15 px-4 py-3 text-sm font-black text-green-100">{successMessage}</div>}

          <button
            data-haptic="success"
            type="submit"
            disabled={posting || !validation.ok}
            className="premium-cta mt-5 w-full rounded-[28px] bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-5 text-xl font-black text-white shadow-2xl shadow-cyan-500/28 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {posting ? "Julkaistaan..." : validation.ok ? "Julkaise 🔥" : "Kirjoita perustelu"}
          </button>
        </form>
      </main>

      <AppBottomNav />
    </div>
  );
}
