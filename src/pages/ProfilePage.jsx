import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useProfile } from "../hooks/useProfile";
import { useFeed } from "../hooks/useFeed";
import { useBoost } from "../hooks/useBoost";
import { useNearMiss } from "../hooks/useNearMiss";
import ProfileCard from "../components/profile/ProfileCard";
import ReputationHistory from "../components/profile/ReputationHistory";
import PremiumButton from "../components/ui/PremiumButton";

export default function ProfilePage({ notifications }) {
  const profile = useProfile();
  const { entries, reload } = useFeed("day");
  const { boost } = useBoost();
  const nearMiss = useNearMiss();
  const [mentor, setMentor] = useState([]);

  useEffect(() => {
    async function loadMentor() {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/reputation-history", { headers: { Authorization: `Bearer ${session?.access_token || ""}` } });
      await res.json();
      const { data } = await supabase.from("mentor_feedback").select("*").order("created_at", { ascending: false }).limit(5);
      setMentor(data || []);
    }
    loadMentor();
  }, []);

  const myPosts = entries.filter((p) => profile?.id && p.profile_id === profile.id);

  async function handleBoost(postId) {
    try {
      await boost(postId);
      notifications.success("Boost tallennettu");
      reload();
    } catch (e) {
      notifications.error(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <ProfileCard profile={profile} />
      <ReputationHistory />
      {nearMiss ? <div className="glass-card p-4 text-amber-100">{nearMiss.message}</div> : null}
      <section className="glass-card p-5">
        <div className="text-xl font-black">AI mentor</div>
        <div className="mt-4 space-y-3">
          {mentor.map((m) => <div key={m.id} className="rounded-2xl bg-white/6 p-4 text-sm text-white/80">{m.feedback}</div>)}
          {!mentor.length ? <div className="text-sm text-white/60">Ei vielä mentoripalautetta.</div> : null}
        </div>
      </section>
      <section className="glass-card p-5">
        <div className="text-xl font-black">Omat perustelut</div>
        <div className="mt-4 space-y-4">
          {myPosts.map((post) => (
            <div key={post.id} className="rounded-2xl bg-white/6 p-4">
              <div className="font-bold">{post.title || "Perustelusi"}</div>
              <div className="mt-2 text-sm text-white/80">{post.text}</div>
              <div className="mt-3 text-xs text-white/60">Boostit {post.boost_count || 0} • Näkyvyys {Number(post.boost_visibility || 0).toFixed(2)}</div>
              <PremiumButton variant="gold" className="mt-3" onClick={() => handleBoost(post.id)}>Korosta näkyvyyttä</PremiumButton>
            </div>
          ))}
          {!myPosts.length ? <div className="text-sm text-white/60">Ei aktiivisia perusteluja.</div> : null}
        </div>
      </section>
    </div>
  );
}
