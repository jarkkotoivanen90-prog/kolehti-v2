import { useState } from "react";
import SectionHeader from "../components/ui/SectionHeader";
import PremiumButton from "../components/ui/PremiumButton";
import { supabase } from "../lib/supabaseClient";

export default function NewPostPage({ notifications }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    try {
      setBusy(true);
      const session = supabase ? await supabase.auth.getSession() : { data: { session: null } };
      const res = await fetch("/api/submit-entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.data?.session?.access_token || ""}`,
        },
        body: JSON.stringify({ text, drawType: "day" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Tallennus epäonnistui");
      notifications.success("Perustelu tallennettu");
      setText("");
    } catch (e) {
      notifications.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="glass-card p-5">
        <SectionHeader eyebrow="Uusi perustelu" title="Kerro miksi tarvitset tukea" subtitle="Paras tulos syntyy, kun kerrot tilanteen selkeästi ja konkreettisesti." />
        <div className="mt-5 space-y-4">
          <textarea
            className="min-h-[180px] w-full rounded-2xl border border-white/12 bg-white/6 p-4 text-white outline-none"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tarvitsen apua, koska..."
          />
          <div className="text-sm text-white/60">AI suosittelee: lisää yksi konkreettinen summa ja vahva ensimmäinen lause.</div>
          <PremiumButton onClick={submit} disabled={busy || !text.trim()}>
            {busy ? "Tallennetaan..." : "Lähetä perustelu"}
          </PremiumButton>
        </div>
      </section>
    </div>
  );
}
