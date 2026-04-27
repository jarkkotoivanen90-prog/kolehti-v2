import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { runViralLoopV2 } from "../lib/viralLoop";

const INVITE_GOAL = 3;

export default function GrowthPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadGrowth();
  }, []);

  async function loadGrowth() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return;
    }

    setUser(user);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileData && !profileData.referral_code) {
      await supabase
        .from("profiles")
        .update({ referral_code: user.id })
        .eq("id", user.id);
    }

    const { data: refreshedProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    const activeProfile = refreshedProfile || profileData || null;

    if (activeProfile) {
      await runViralLoopV2(user.id, activeProfile);
    }

    const { data: leaderboardData } = await supabase
      .from("profiles")
      .select("id, display_name, username, active_badge, referral_count, growth_score, xp, level")
      .order("growth_score", { ascending: false })
      .limit(20);

    const { data: referralData } = await supabase
      .from("referrals")
      .select("*")
      .eq("inviter_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    setProfile(activeProfile);
    setLeaderboard(leaderboardData || []);
    setReferrals(referralData || []);
    setLoading(false);
  }

  const inviteCode = profile?.referral_code || user?.id || "";

  const inviteLink = useMemo(() => {
    if (!inviteCode) return "";
    return `${window.location.origin}/login?ref=${inviteCode}`;
  }, [inviteCode]);

  const referralCount = Number(profile?.referral_count || 0);
  const progress = Math.min(100, Math.round((referralCount / INVITE_GOAL) * 100));
  const remaining = Math.max(0, INVITE_GOAL - referralCount);

  async function copyInvite() {
    if (!inviteLink) return;

    await navigator.clipboard.writeText(inviteLink);

    await supabase.from("growth_events").insert({
      user_id: user.id,
      event_type: "invite_link_copied",
      source: "growth_page",
      points: 5,
      meta: { invite_code: inviteCode },
    });

    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function shareInvite() {
    const text = "Liity mun Kolehti-porukkaan. Yhdessä voidaan nousta leaderboardissa 🚀";

    if (navigator.share) {
      await navigator.share({
        title: "Kolehti",
        text,
        url: inviteLink,
      });
    } else {
      await copyInvite();
    }

    await supabase.from("growth_events").insert({
      user_id: user.id,
      event_type: "invite_shared",
      source: "growth_page",
      points: 10,
      meta: { invite_code: inviteCode },
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] p-6 text-white">
        <div className="mx-auto max-w-md rounded-[34px] border border-white/10 bg-white/10 p-6 text-center shadow-2xl">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-cyan-300 border-t-transparent" />
          <p className="font-black text-white/70">Ladataan growth engineä...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050816] px-4 py-6 pb-32 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#153b92_0%,#050816_45%,#02030a_100%)]" />

      <main className="mx-auto max-w-4xl">
        <header className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-cyan-200">Growth engine</p>
            <h1 className="mt-1 text-4xl font-black">Kutsu porukka kasvuun 🚀</h1>
            <p className="mt-2 text-sm font-bold text-white/55">
              Kutsu kavereita, nosta growth-scorea ja rakenna vahvin porukka.
            </p>
          </div>

          <Link to="/feed" className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black">
            Feed
          </Link>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Stat title="Kutsut" value={referralCount} icon="🤝" />
          <Stat title="Growth score" value={profile?.growth_score || 0} icon="📈" />
          <Stat title="XP" value={profile?.xp || 0} icon="⚡" />
        </section>

        <section className="mt-5 overflow-hidden rounded-[36px] border border-cyan-300/20 bg-cyan-500/10 p-5 shadow-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-cyan-200">Viral mission</div>
              <h2 className="mt-1 text-3xl font-black">
                Kutsu {INVITE_GOAL} jäsentä → avaa growth bonus
              </h2>
              <p className="mt-2 text-sm font-bold text-white/60">
                {remaining > 0
                  ? `Vielä ${remaining} kutsua seuraavaan bonus-tasoon.`
                  : "Bonus-taso avattu. Jatka kutsumista ja hallitse leaderboardia."}
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/25 p-4 text-center md:w-44">
              <div className="text-5xl font-black text-cyan-200">{progress}%</div>
              <div className="mt-1 text-xs font-black text-white/50">valmis</div>
            </div>
          </div>

          <div className="mt-5 h-4 overflow-hidden rounded-full bg-black/30">
            <div
              className="h-full rounded-full bg-cyan-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        <section className="mt-5 rounded-[36px] border border-white/10 bg-white/10 p-5 shadow-2xl">
          <h2 className="text-2xl font-black">Oma kutsulinkki</h2>
          <p className="mt-2 text-sm font-bold text-white/55">
            Jaa tämä linkki. Kun uusi käyttäjä liittyy, saat growth-pisteitä ja XP:tä.
          </p>

          <div className="mt-4 break-all rounded-3xl border border-white/10 bg-black/35 p-4 text-sm font-bold text-cyan-100">
            {inviteLink}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              onClick={copyInvite}
              className="rounded-3xl bg-cyan-500 px-5 py-4 text-lg font-black shadow-xl shadow-cyan-500/20 active:scale-95"
            >
              {copied ? "Kopioitu ✅" : "Kopioi linkki"}
            </button>

            <button
              onClick={shareInvite}
              className="rounded-3xl border border-white/10 bg-white/10 px-5 py-4 text-lg font-black active:scale-95"
            >
              Jaa kutsu 📲
            </button>
          </div>
        </section>

        <section className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="rounded-[36px] border border-yellow-300/20 bg-yellow-500/10 p-5 shadow-2xl">
            <h2 className="text-2xl font-black text-yellow-100">🏆 Growth leaderboard</h2>
            <div className="mt-4 space-y-3">
              {leaderboard.length === 0 ? (
                <Empty text="Ei vielä growth-dataa." />
              ) : (
                leaderboard.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-3xl bg-black/25 p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-lg font-black">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-black">{item.display_name || item.username || "Kolehti-user"}</div>
                        <div className="text-xs font-bold text-white/45">{item.active_badge || "🌱"} · LVL {item.level || 1}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-yellow-100">{item.growth_score || 0}</div>
                      <div className="text-xs font-bold text-white/45">{item.referral_count || 0} kutsua</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[36px] border border-white/10 bg-white/10 p-5 shadow-2xl">
            <h2 className="text-2xl font-black">📨 Omat kutsut</h2>
            <div className="mt-4 space-y-3">
              {referrals.length === 0 ? (
                <Empty text="Ei vielä kutsuja. Kopioi linkki ja jaa se." />
              ) : (
                referrals.map((referral) => (
                  <div key={referral.id} className="rounded-3xl bg-black/25 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-black">{referral.status === "completed" ? "Liittynyt ✅" : "Odottaa"}</div>
                        <div className="mt-1 text-xs font-bold text-white/45">
                          {new Date(referral.created_at).toLocaleString("fi-FI")}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-cyan-500/20 px-3 py-2 text-sm font-black text-cyan-100">
                        +{referral.reward_xp || 100} XP
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

function Stat({ title, value, icon }) {
  return (
    <div className="rounded-[32px] border border-white/10 bg-white/10 p-5 shadow-2xl">
      <div className="text-3xl">{icon}</div>
      <div className="mt-3 text-sm font-black text-cyan-200">{title}</div>
      <div className="mt-2 text-4xl font-black">{value}</div>
    </div>
  );
}

function Empty({ text }) {
  return <div className="rounded-3xl bg-black/25 p-4 text-sm font-bold text-white/50">{text}</div>;
}

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md rounded-t-[30px] border border-white/10 bg-[#061126]/95 px-4 pb-4 pt-3 text-white shadow-2xl backdrop-blur-xl">
      <div className="grid grid-cols-5 items-end text-center text-xs font-black">
        <Link to="/feed">🔥<div>Feed</div></Link>
        <Link to="/groups">👥<div>Porukat</div></Link>
        <Link to="/new" className="-mt-8">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blue-500 text-5xl shadow-2xl shadow-blue-500/40">+</div>
          <div>Uusi</div>
        </Link>
        <Link to="/growth" className="text-cyan-300">🚀<div>Growth</div></Link>
        <Link to="/profile">👤<div>Profiili</div></Link>
      </div>
    </nav>
  );
}
