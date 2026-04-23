import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function FlagSwitch({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between rounded-2xl bg-white/6 px-4 py-3">
      <span className="text-sm font-semibold">{label}</span>
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function WeightSlider({ label, value, onChange, min = 0, max = 1, step = 0.01 }) {
  return (
    <div className="rounded-2xl bg-white/6 p-3">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-bold">{Number(value || 0).toFixed(2)}</span>
      </div>
      <input className="w-full" type="range" min={min} max={max} step={step} value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

export default function AdminDashboard({ notifications }) {
  const [data, setData] = useState(null);

  async function token() {
    const session = supabase ? await supabase.auth.getSession() : { data: { session: null } };
    return session?.data?.session?.access_token || "";
  }

  async function load() {
    const t = await token();
    const res = await fetch("/api/admin/dashboard?drawType=day", { headers: { Authorization: `Bearer ${t}` } });
    const json = await res.json();
    setData(json);
  }

  async function saveConfig(nextPartial) {
    try {
      const t = await token();
      await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify(nextPartial),
      });
      notifications.success("Asetukset tallennettu");
      await load();
    } catch {
      notifications.error("Tallennus epäonnistui");
    }
  }

  useEffect(() => { load(); }, []);

  if (!data) return <div className="glass-card p-6">Ladataan dashboardia...</div>;

  return (
    <div className="space-y-6">
      <section className="glass-card p-5">
        <div className="headline-lg">Admin dashboard</div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl bg-white/6 p-4 space-y-2">
            <div className="font-black">Featuret</div>
            <FlagSwitch label="AI feed" checked={data.toggles?.ai_feed_enabled} onChange={(v) => saveConfig({ feature_flags: { ...data.toggles, ai_feed_enabled: v } })} />
            <FlagSwitch label="Personalized" checked={data.toggles?.personalized_feed_enabled} onChange={(v) => saveConfig({ feature_flags: { ...data.toggles, personalized_feed_enabled: v } })} />
            <FlagSwitch label="Shadow" checked={data.toggles?.shadow_moderation_enabled} onChange={(v) => saveConfig({ feature_flags: { ...data.toggles, shadow_moderation_enabled: v } })} />
            <FlagSwitch label="Growth" checked={data.toggles?.growth_feed_bonus_enabled} onChange={(v) => saveConfig({ feature_flags: { ...data.toggles, growth_feed_bonus_enabled: v } })} />
          </div>
          <div className="rounded-2xl bg-white/6 p-4 space-y-3">
            <div className="font-black">A/B test</div>
            <FlagSwitch label="Enabled" checked={data.ab_test?.enabled} onChange={(v) => saveConfig({ ab_test: { ...data.ab_test, enabled: v } })} />
            <WeightSlider label="AI traffic %" min={0} max={100} step={1} value={data.ab_test?.traffic_split_ai || 50} onChange={(v) => saveConfig({ ab_test: { ...data.ab_test, traffic_split_ai: v } })} />
          </div>
          <div className="rounded-2xl bg-white/6 p-4 space-y-3">
            <div className="font-black">Feed painot</div>
            {["ai","quality","engagement","freshness","trust","visibility"].map((k) => (
              <WeightSlider key={k} label={k} value={data.feed_weights?.[k]} onChange={(v) => saveConfig({ feed_weights: { ...data.feed_weights, [k]: v } })} />
            ))}
          </div>
        </div>
      </section>
      <section className="grid gap-4 xl:grid-cols-4">
        {[
          ["Vote order", data.normal, "votes"],
          ["AI feed", data.ai, "dashboard_ai_score"],
          ["Personalized", data.personalized, "personalized_score"],
          ["Shadow hidden", data.shadow_hidden, "votes"],
        ].map(([title, items, metric]) => (
          <div key={title} className="glass-card p-4">
            <div className="font-black">{title}</div>
            <div className="mt-3 space-y-2">
              {(items || []).slice(0, 10).map((item, idx) => (
                <div key={item.id} className="rounded-2xl bg-white/6 p-3">
                  <div className="text-sm text-white/60">#{idx+1} • {item.display_name}</div>
                  <div className="font-semibold">{item.title}</div>
                  <div className="mt-1 text-xs text-white/60">{metric}: {Number(item[metric] || 0).toFixed(3)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
