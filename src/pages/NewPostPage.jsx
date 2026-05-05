import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import AdaptiveBackground from "../components/AdaptiveBackground";
import { haptic } from "../lib/effects";
import {
  validatePostInput,
  normalizePostForInsert,
  logClientError,
} from "../lib/postSafety";

const BG =
  "https://commons.wikimedia.org/wiki/Special:FilePath/Ikaalinen_-_lake_and_forest.jpg?width=1600";

function scoreText(text) {
  const clean = String(text || "").trim();
  const lengthScore = Math.min(35, Math.round(clean.length / 12));
  const clarityScore =
    /koska|siksi|auttaa|tarvitsen|porukka|yhdessa|yhdessä|tukea/i.test(clean)
      ? 25
      : 10;
  const structureScore = /[.!?]/.test(clean) ? 20 : 10;
  const emotionScore =
    /kiitos|toivo|apua|yhteiso|yhteisö|perhe|ystava|ystävä/i.test(clean)
      ? 20
      : 10;

  const score = Math.max(
    35,
    Math.min(100, lengthScore + clarityScore + structureScore + emotionScore)
  );

  return {
    score,
    ai_score: score,
    ai_quality: Math.min(100, score + 3),
    ai_need: Math.min(100, Math.max(30, score - 5)),
    ai_clarity: Math.min(100, clarityScore * 3),
    ai_risk: 0,
    label:
      score >= 80 ? "Vahva perustelu" : score >= 60 ? "Hyvä alku" : "Paranna vielä",
    tip:
      score >= 80
        ? "Tämä on selkeä ja uskottava perustelu."
        : "Lisää yksi konkreettinen syy: miksi juuri tätä pitäisi tukea?",
    rewrite: "",
  };
}

function detectMediaType(url, selectedType) {
  const clean = String(url || "").trim();
  if (!clean) return null;
  if (selectedType === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(clean)) {
    return "video";
  }
  return "image";
}

function calculateWinProbability(text, aiScore) {
  const clean = String(text || "");
  let base = Number(aiScore || 50);

  if (clean.length > 120) base += 5;
  if (clean.length > 220) base += 5;
  if (/[.!?]/.test(clean)) base += 5;
  if (/perhe|ystävä|apua|tarvitsen|tukea|yhteisö|yhteiso/i.test(clean)) base += 8;

  return Math.max(5, Math.min(95, Math.round(base)));
}

function getBestSentence(text) {
  const sentences = String(text || "")
    .split(/[.!?]/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (!sentences.length) return null;

  function scoreSentence(sentence) {
    let score = sentence.length;
    if (/perhe|ystävä|apua|tarvitsen|tukea|yhteisö|yhteiso/i.test(sentence)) {
      score += 30;
    }
    if (/koska|siksi|jotta/i.test(sentence)) score += 20;
    if (sentence.length > 80) score += 10;
    return score;
  }

  return sentences.reduce((best, current) =>
    scoreSentence(current) > scoreSentence(best) ? current : best
  );
}

function getBoostEffect(boostLevel, baseChance) {
  const visibility = boostLevel * 12;
  const extraWin = boostLevel * 5;

  return {
    visibility,
    newChance: Math.min(99, baseChance + extraWin),
  };
}

function getBoostPrice(level) {
  if (!level) return "0.00";
  const base = 0.5;
  return (base * Math.pow(1.8, level)).toFixed(2);
}

function getBoostRecommendation(winChance, text) {
  if (!text || text.length < 40) {
    return {
      level: 0,
      message: "Kirjoita ensin vahvempi perustelu ennen boostia.",
    };
  }

  if (winChance > 80) {
    return {
      level: 0,
      message: "Perustelusi on jo vahva – säästä boost.",
    };
  }

  if (winChance > 65) {
    return {
      level: 1,
      message: "Pieni boost voi nostaa näkyvyyttä juuri tarpeeksi.",
    };
  }

  if (winChance > 50) {
    return {
      level: 2,
      message: "Tarvitset lisää näkyvyyttä kilpaillaksesi kärjestä.",
    };
  }

  return {
    level: 3,
    message: "Näkyvyys on vielä matala – maksimi boost on suositeltava.",
  };
}

function getOptimalBoost(winChance) {
  if (winChance > 80) {
    return { level: 0, reason: "Perustelu on jo vahva – boost ei ole tarpeen." };
  }

  if (winChance > 65) {
    return { level: 1, reason: "Pieni boost riittää nostamaan näkyvyyttä." };
  }

  if (winChance > 50) {
    return { level: 2, reason: "Lisänäkyvyys auttaa pääsemään kilpailuun mukaan." };
  }

  return { level: 3, reason: "Matala näkyvyys – suositellaan maksimi boostia." };
}

function calculateROI(baseChance, boostedChance, price) {
  const gain = boostedChance - baseChance;

  if (!price || price <= 0) {
    return { gain: 0, roi: 0, label: "Ei boostia" };
  }

  const roi = gain / price;

  return {
    gain,
    roi: Number(roi.toFixed(2)),
    label:
      roi > 3
        ? "🔥 Erinomainen"
        : roi > 1.5
          ? "⚡ Hyvä"
          : roi > 0.5
            ? "👌 Kohtalainen"
            : "⚠️ Heikko",
  };
}

function Meter({ label, value, boostedValue }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-black text-cyan-100/72">
        <span>{label}</span>
        <span>{value}%</span>
      </div>

      <div className="relative h-2.5 overflow-hidden rounded-full bg-white/10">
        {boostedValue > value && (
          <div
            className="absolute inset-y-0 left-0 bg-emerald-400/28 transition-all duration-500"
            style={{ width: `${boostedValue}%` }}
          />
        )}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
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

  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [oneTimeEntry, setOneTimeEntry] = useState(false);
  const [boostLevel, setBoostLevel] = useState(0);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUser(data?.user || null);
    });

    const sub = localStorage.getItem("kolehti_sub");
    setIsSubscribed(Boolean(sub));

    return () => {
      mounted = false;
    };
  }, []);

  const validation = useMemo(() => validatePostInput(content), [content]);
  const localPreview = useMemo(() => scoreText(content), [content]);
  const cleanMediaUrl = String(mediaUrl || "").trim();
  const resolvedMediaType = detectMediaType(cleanMediaUrl, mediaType);

  useEffect(() => {
    if (!content || content.trim().length < 28) {
      setAiResult(null);
      setAiLoading(false);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setAiLoading(true);

      try {
        const res = await fetch("/api/ai-coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: content }),
        });

        if (!res.ok) throw new Error("AI request failed");

        const data = await res.json();
        setAiResult({
          ...data,
          score: Number(data?.score || localPreview.score),
          ai_score: Number(data?.score || localPreview.score),
          ai_quality: Number(data?.score || localPreview.ai_quality),
          ai_need: Number(data?.ai_need || localPreview.ai_need),
          ai_clarity: Number(data?.ai_clarity || localPreview.ai_clarity),
          ai_risk: Number(data?.ai_risk || 0),
          label: data?.label || localPreview.label,
          tip: data?.tip || localPreview.tip,
          rewrite: data?.rewrite || "",
        });
      } catch {
        setAiResult(null);
      } finally {
        setAiLoading(false);
      }
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [content, localPreview.score]);

  const aiPreview = aiResult || localPreview;
  const score = Math.max(0, Math.min(100, Number(aiPreview.score || 0)));
  const winChance = calculateWinProbability(content, score);
  const bestSentence = getBestSentence(content);

  const boostEffect = getBoostEffect(boostLevel, winChance);
  const boostPrice = getBoostPrice(boostLevel);
  const boostAI = getBoostRecommendation(winChance, content);
  const optimal = getOptimalBoost(winChance);
  const roi = calculateROI(winChance, boostEffect.newChance, Number(boostPrice));

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!user) {
      navigate("/login");
      return;
    }

    if (!isSubscribed && !oneTimeEntry) {
      setErrorMessage("Valitse 5€ kertamaksu tai kuukausitilaus ennen julkaisua.");
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
      const basePayload = normalizePostForInsert({
        content: checked.content,
        user,
        groupId,
        aiResult: aiPreview,
      });

      const payload = {
        ...basePayload,
        boost_score: Number(basePayload.boost_score || 0) + boostLevel * 10,
        entry_type: isSubscribed ? "subscription" : "one_time",
        one_time_entry: !isSubscribed && oneTimeEntry,
        boost_level: boostLevel,
        boost_price: Number(boostPrice),
        win_probability: boostEffect.newChance,
      };

      const finalPayload = cleanMediaUrl
        ? {
            ...payload,
            media_url: cleanMediaUrl,
            media_type: resolvedMediaType,
            image_url: resolvedMediaType === "image" ? cleanMediaUrl : null,
            video_url: resolvedMediaType === "video" ? cleanMediaUrl : null,
          }
        : payload;

      const { error } = await supabase.from("posts").insert(finalPayload);

      if (error && cleanMediaUrl) {
        const retry = await supabase.from("posts").insert(payload);
        if (retry.error) throw retry.error;
      } else if (error) {
        throw error;
      }

      await supabase.from("user_events").insert({
        user_id: user.id,
        event_type: resolvedMediaType ? "media_post_created" : "post_created",
        source: "new_post",
        meta: {
          media_type: resolvedMediaType || "text",
          boost_level: boostLevel,
          boost_price: Number(boostPrice),
          entry_type: isSubscribed ? "subscription" : "one_time",
          one_time_entry: !isSubscribed && oneTimeEntry,
        },
      });

      setContent("");
      setMediaUrl("");
      setBoostLevel(0);
      setSuccessMessage("Postaus julkaistu.");
      haptic("success");

      window.setTimeout(() => navigate("/feed"), 900);
    } catch (err) {
      await logClientError(supabase, {
        source: "new_post_ai_boost",
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
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100/62">
          Uusi entry
        </p>
        <h1 className="mt-2 text-[44px] font-black leading-none tracking-tight">
          Uusi postaus
        </h1>
        <p className="mt-2 text-sm font-bold text-cyan-100/70">
          Kirjoita perustelu, optimoi näkyvyys ja julkaise feediin.
        </p>

        <form
          onSubmit={handleSubmit}
          className="relative mt-6 overflow-hidden rounded-[34px] border border-cyan-200/20 bg-[#041226]/78 p-5 text-white shadow-2xl shadow-cyan-500/10"
        >
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
              <span>
                {aiLoading ? "AI analysoi..." : `AI ${score} · ${aiPreview.label}`}
              </span>
            </div>

            <div className="mt-4 space-y-4 rounded-[24px] border border-cyan-300/18 bg-[rgba(14,165,255,0.10)] p-4">
              <Meter label="AI arvio" value={score} />
              <Meter
                label="Voittotodennäköisyys"
                value={winChance}
                boostedValue={boostLevel > 0 ? boostEffect.newChance : undefined}
              />

              <div className="text-xs font-bold text-cyan-50/78">
                {winChance > 80 && "🔥 Erittäin vahva – tämä voi voittaa."}
                {winChance > 60 &&
                  winChance <= 80 &&
                  "⚡ Hyvä – pieni parannus voi nostaa kärkeen."}
                {winChance <= 60 &&
                  "💡 Lisää konkreettinen ja henkilökohtainen syy."}
              </div>
            </div>

            <p className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-500/10 px-4 py-3 text-sm font-bold text-cyan-50/80">
              {aiPreview.tip}
            </p>

            {bestSentence && (
              <div className="mt-4 rounded-2xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-3">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200/78">
                  Paras kohta
                </div>
                <div className="mt-1 text-sm font-bold text-white">
                  “{bestSentence}”
                </div>
              </div>
            )}

            {aiPreview.rewrite && (
              <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-white/[.055] px-4 py-3">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/62">
                  AI ehdotus
                </div>
                <div className="mt-1 text-sm font-bold text-white/88">
                  {aiPreview.rewrite}
                </div>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMediaType("image")}
                className={`rounded-2xl border px-4 py-3 font-black transition active:scale-95 ${
                  mediaType === "image"
                    ? "border-[rgba(139,238,255,0.50)] bg-[rgba(14,165,255,0.34)]"
                    : "border-white/10 bg-white/[.055] text-white/68"
                }`}
              >
                Kuva
              </button>
              <button
                type="button"
                onClick={() => setMediaType("video")}
                className={`rounded-2xl border px-4 py-3 font-black transition active:scale-95 ${
                  mediaType === "video"
                    ? "border-[rgba(139,238,255,0.50)] bg-[rgba(14,165,255,0.34)]"
                    : "border-white/10 bg-white/[.055] text-white/68"
                }`}
              >
                Video
              </button>
            </div>

            <input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="Kuvan tai videon URL (valinnainen)"
              className="mt-3 w-full rounded-[22px] border border-cyan-100/10 bg-white/[.055] px-4 py-4 font-bold text-white outline-none placeholder:text-white/35"
            />

            {!isSubscribed && (
              <button
                type="button"
                onClick={() => {
                  setOneTimeEntry((value) => !value);
                  haptic("tap");
                }}
                className={`mt-5 w-full rounded-[24px] border px-6 py-5 text-lg font-black text-white shadow-xl transition active:scale-95 ${
                  oneTimeEntry
                    ? "border-[rgba(139,238,255,0.60)] bg-[rgba(14,165,255,0.38)] shadow-cyan-500/20"
                    : "border-[rgba(139,238,255,0.40)] bg-[rgba(14,165,255,0.25)] shadow-cyan-500/10"
                }`}
              >
                {oneTimeEntry ? "5€ kertamaksu valittu" : "Osallistu 5€"}
              </button>
            )}

            <div className="mt-5 rounded-[26px] border border-cyan-300/24 bg-[rgba(14,165,255,0.10)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-cyan-100">
                    Boost näkyvyys
                  </div>
                  <div className="text-xs font-bold text-white/58">
                    Korosta omaa perusteluasi feedissä.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setBoostLevel(optimal.level)}
                  className="shrink-0 rounded-2xl border border-[rgba(139,238,255,0.4)] bg-[rgba(14,165,255,0.22)] px-3 py-2 text-xs font-black text-white transition active:scale-95"
                >
                  Optimoi +{optimal.level}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[1, 2, 3].map((level) => {
                  const active = boostLevel >= level;
                  const recommended = boostAI.level === level;

                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => {
                        setBoostLevel(level);
                        haptic("tap");
                      }}
                      className={`rounded-2xl border px-2 py-3 text-sm font-black transition active:scale-95 ${
                        active
                          ? "border-[rgba(139,238,255,0.56)] bg-[rgba(14,165,255,0.36)] text-white"
                          : recommended
                            ? "border-emerald-300/50 bg-emerald-400/18 text-white"
                            : "border-white/10 bg-white/[.055] text-white/62"
                      }`}
                    >
                      +{level}
                      <div className="mt-1 text-[10px] font-black text-white/58">
                        €{getBoostPrice(level)}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 text-xs font-bold text-white/62">
                {optimal.reason}
              </div>

              {boostLevel !== optimal.level && (
                <div className="mt-2 text-xs font-black text-cyan-200">
                  AI suosittelee tasoa +{optimal.level}
                </div>
              )}

              <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-white/[.045] p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/62">
                  Boost vaikutus
                </div>

                <div className="mt-3 space-y-2 text-sm font-bold">
                  <div className="flex justify-between">
                    <span className="text-white/62">Näkyvyys</span>
                    <span className="text-cyan-200">
                      +{boostEffect.visibility}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/62">Voittotodennäköisyys</span>
                    <span className="text-emerald-300">
                      {winChance}% → {boostEffect.newChance}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/62">Boost yhteensä</span>
                    <span className="text-cyan-200">€{boostPrice}</span>
                  </div>
                </div>
              </div>

              {boostLevel > 0 && (
                <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-white/[.045] p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/62">
                    Boost ROI
                  </div>

                  <div className="mt-3 space-y-2 text-sm font-bold">
                    <div className="flex justify-between">
                      <span className="text-white/62">Lisäys</span>
                      <span className="text-emerald-300">+{roi.gain}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/62">Teho / €</span>
                      <span>{roi.roi}</span>
                    </div>
                    <div
                      className={`font-black ${
                        roi.roi > 3
                          ? "text-emerald-300"
                          : roi.roi > 1.5
                            ? "text-cyan-200"
                            : roi.roi > 0.5
                              ? "text-yellow-200"
                              : "text-red-300"
                      }`}
                    >
                      {roi.label}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-3 text-xs font-bold text-cyan-50/72">
                {boostAI.message}
              </div>
            </div>

            {errorMessage && (
              <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm font-black text-red-100">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="mt-4 rounded-2xl border border-green-400/30 bg-green-500/15 px-4 py-3 text-sm font-black text-green-100">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={posting || !validation.ok}
              className="mt-5 w-full rounded-[28px] bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-5 text-xl font-black text-white shadow-2xl shadow-cyan-500/25 transition active:scale-[0.99] disabled:opacity-40"
            >
              {posting ? "Julkaistaan..." : "Julkaise"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
