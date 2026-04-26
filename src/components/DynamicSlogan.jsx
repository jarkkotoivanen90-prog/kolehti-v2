import { useEffect, useState } from "react";

const fallbackSlogans = [
  {
    headline: "Puhu. Vakuuta. Voita.",
    subline: "Paras perustelu nousee esiin.",
  },
  {
    headline: "Äly valitsee.",
    subline: "Yhteisö ratkaisee.",
  },
  {
    headline: "Yhdessä noustaan.",
    subline: "Yhdessä voitetaan.",
  },
  {
    headline: "Nouse listalle.",
    subline: "Muuta huominen.",
  },
];

export default function DynamicSlogan({ mood = "premium" }) {
  const [slogan, setSlogan] = useState(fallbackSlogans[0]);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    loadSlogan();

    const interval = setInterval(() => {
      rotateFallback();
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  async function loadSlogan() {
    try {
      const res = await fetch("/api/ai-slogan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mood }),
      });

      const data = await res.json();

      if (data?.headline && data?.subline) {
        setSlogan(data);
      }
    } catch {
      rotateFallback();
    }
  }

  function rotateFallback() {
    setFade(false);

    setTimeout(() => {
      setSlogan((current) => {
        const index = fallbackSlogans.findIndex(
          (item) => item.headline === current.headline
        );

        return fallbackSlogans[(index + 1) % fallbackSlogans.length];
      });

      setFade(true);
    }, 250);
  }

  return (
    <div className="pointer-events-none absolute bottom-6 left-0 right-0 z-20 text-center">
      <div
        className={`transition-all duration-500 ${
          fade ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <h2 className="text-4xl font-black leading-none text-white drop-shadow-2xl">
          {slogan.headline}
        </h2>

        <p className="mt-2 text-3xl font-black leading-none text-pink-400 drop-shadow-2xl">
          {slogan.subline}
        </p>
      </div>
    </div>
  );
}
