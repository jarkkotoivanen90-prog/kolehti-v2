import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function NewPostPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const analysis = analyzeText(text);

  async function handleSubmit() {
    if (!text) return;

    setLoading(true);

    const user = await supabase.auth.getUser();

    await supabase.from("posts").insert({
      content: text,
      user_id: user.data.user.id,
    });

    setText("");
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white p-4">
      <h1 className="text-2xl font-black mb-4">Kirjoita perustelu</h1>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Kerro miksi juuri sinä tarvitset tukea..."
        className="w-full h-40 p-4 rounded-xl bg-white/10 border border-white/20 outline-none"
      />

      {/* 🔥 AI ANALYSIS */}
      <div className="mt-4 space-y-3">

        <AIBox title="Selkeys" value={analysis.clarity} />

        <AIBox title="Tunne" value={analysis.emotion} />

        <AIBox title="Uskottavuus" value={analysis.trust} />

        <AIBox title="Vahvuus" value={analysis.score} big />

      </div>

      {/* 🔥 AI SUGGESTIONS */}
      <div className="mt-4 bg-white/10 p-4 rounded-xl">
        <h3 className="font-black mb-2">🤖 AI ehdottaa</h3>
        <ul className="text-sm text-white/80 space-y-1">
          {analysis.tips.map((tip, i) => (
            <li key={i}>• {tip}</li>
          ))}
        </ul>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-6 w-full bg-blue-500 py-3 rounded-xl font-black"
      >
        {loading ? "Lähetetään..." : "Lähetä perustelu"}
      </button>
    </div>
  );
}

/* =========================
   AI ANALYSIS LOGIC
========================= */

function analyzeText(text) {
  const length = text.length;

  const clarity = length > 120 ? "Hyvä" : "Heikko";

  const emotion =
    text.includes("tarvitsen") ||
    text.includes("vaikeaa") ||
    text.includes("perhe")
      ? "Vahva"
      : "Heikko";

  const trust =
    text.includes("€") ||
    text.includes("lasku") ||
    text.includes("vuokra")
      ? "Korkea"
      : "Matala";

  const score =
    (length > 120 ? 40 : 20) +
    (emotion === "Vahva" ? 30 : 10) +
    (trust === "Korkea" ? 30 : 10);

  const tips = [];

  if (length < 120) tips.push("Kirjoita pidempi ja tarkempi perustelu");
  if (emotion !== "Vahva") tips.push("Lisää tunnetta ja henkilökohtaisuutta");
  if (trust !== "Korkea") tips.push("Lisää konkreettisia esimerkkejä (summa, tilanne)");

  return {
    clarity,
    emotion,
    trust,
    score,
    tips,
  };
}

function AIBox({ title, value, big }) {
  return (
    <div className="bg-white/10 p-3 rounded-xl flex justify-between items-center">
      <span className="font-bold">{title}</span>
      <span className={`font-black ${big ? "text-xl text-green-400" : ""}`}>
        {value}
      </span>
    </div>
  );
}
