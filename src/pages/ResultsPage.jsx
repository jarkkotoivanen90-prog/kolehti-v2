import { useEffect, useState } from "react";

export default function ResultsPage() {
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/get-round-result?drawType=day");
      const data = await res.json();
      setResult(data?.result || null);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <section className="glass-card p-5">
        <div className="section-title">Tulokset</div>
        <div className="mt-2 headline-lg">Edellisen kierroksen voittaja</div>
        {result ? (
          <div className="mt-5 rounded-2xl bg-emerald-500/10 p-5 border border-emerald-300/10">
            <div className="text-xl font-black">{result.profile_name}</div>
            <div className="mt-2 text-white/85">{result.summary}</div>
            {result.reason_summary ? <div className="mt-3 text-sm text-emerald-200">{result.reason_summary}</div> : null}
          </div>
        ) : (
          <div className="mt-4 text-sm text-white/60">Ei vielä tuloksia.</div>
        )}
      </section>
    </div>
  );
}
