import { useEffect, useState } from "react";

export default function BrandFX() {
  const [bursts, setBursts] = useState([]);

  useEffect(() => {
    function onMotion(event) {
      const detail = event.detail || {};
      const type = detail.type || "tap";
      if (!["like", "superlike", "reward", "rankup", "nearwin", "press"].includes(type)) return;

      const id = `${Date.now()}-${Math.random()}`;
      const x = typeof detail.x === "number" ? detail.x : window.innerWidth * 0.5;
      const y = typeof detail.y === "number" ? detail.y : window.innerHeight * 0.54;
      setBursts((prev) => [...prev.slice(-5), { id, type, x, y }]);
      window.setTimeout(() => setBursts((prev) => prev.filter((item) => item.id !== id)), 1100);
    }

    window.addEventListener("kolehti:motion", onMotion);
    return () => window.removeEventListener("kolehti:motion", onMotion);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden">
      {bursts.map((burst) => (
        <div
          key={burst.id}
          className={`brand-fx-burst brand-fx-${burst.type}`}
          style={{ left: burst.x, top: burst.y }}
        >
          <span className="brand-fx-heart">💙</span>
          <span className="brand-fx-ring" />
          <span className="brand-fx-spark s1" />
          <span className="brand-fx-spark s2" />
          <span className="brand-fx-spark s3" />
          <span className="brand-fx-spark s4" />
        </div>
      ))}
    </div>
  );
}
