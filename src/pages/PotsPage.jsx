import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date = new Date()) {
  const d = startOfDay(date);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return d;
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfQuarter(date = new Date()) {
  const quarterMonth = Math.floor(date.getMonth() / 3) * 3;
  return new Date(date.getFullYear(), quarterMonth, 1);
}

function iso(date) {
  return date.toISOString();
}

function getVotes(post) {
  return Number(post.vote_count || post.votes || 0);
}

export default function PotsPage() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user || null);

    const quarterStart = startOfQuarter();

    const [postsRes, groupsRes, profilesRes] = await Promise.all([
      supabase
        .from("posts")
        .select("*")
        .gte("created_at", iso(quarterStart))
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("groups").select("*").limit(200),
      supabase
        .from("profiles")
        .select("id,username,display_name,xp,level,total_votes_given,total_posts_created")
        .limit(500),
    ]);

    setPosts(postsRes.data || []);
    setGroups(groupsRes.data || []);
    setProfiles(profilesRes.data || []);
    setLoading(false);
  }

  const stats = useMemo(() => {
    const now = new Date();
    const dayStart = startOfDay(now);
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);
    const quarterStart = startOfQuarter(now);

    const dayPosts = posts.filter((p) => new Date(p.created_at) >= dayStart);
    const weekPosts = posts.filter((p) => new Date(p.created_at) >= weekStart);
    const monthPosts = posts.filter((p) => new Date(p.created_at) >= monthStart);
    const quarterPosts = posts.filter((p) => new Date(p.created_at) >= quarterStart);

    const topPost = (list) => [...list].sort((a, b) => getVotes(b) - getVotes(a))[0] || null;

    const groupXp = groups
      .map((group) => {
        const groupPosts = quarterPosts.filter((p) => p.group_id === group.id);
        const xp = groupPosts.reduce((sum, p) => sum + getVotes(p) * 10 + Number(p.ai_score || 0), 0);
        return { ...group, xp: Math.round(xp), posts: groupPosts.length };
      })
      .sort((a, b) => b.xp - a.xp);

    return {
      daily: topPost(dayPosts),
      weekly: topPost(weekPosts),
      monthly: topPost(monthPosts),
      groupTop: groupXp[0] || null,
      groupXp,
      dayPosts,
      weekPosts,
      monthPosts,
    };
  }, [posts, groups]);

  const rules = [
    "Pelaaja voi postata vain kerran viikossa.",
    "Ilman kestotilausta päiväarvontaan voi ostaa lisäpostauksen 5 €/kpl, mutta se ei oikeuta jatkopeleihin.",
    "Viikon eniten tykkäyksiä saanut voittaa viikkopotin.",
    "Sama pelaaja ei voi voittaa viikkopottia kahta kertaa peräkkäin.",
    "Kuukauden eniten tykkäyksiä saanut voittaa kuukausipotin.",
    "Porukat ovat järjestelmän hallinnoimia ja niitä syntyy automaattisesti pelaajamäärän kasvaessa.",
    "Suuren finaalipotin sykli on suosituksena 3 kuukautta.",
    "Suurimman XP-määrän saanut porukka pääsee finaaliin, jossa top-5 pelaajista kaikki äänestävät voittajan.",
  ];

  if (loading) {
    return <div className="min-h-screen bg-[#050816] p-6 text-white">Ladataan potteja...</div>;
  }

  return (
    <div className="min-h-screen bg-[#050816] px-4 py-6 pb-32 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#153b92_0%,#050816_45%,#02030a_100%)]" />

      <main className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-yellow-200">Kilpailut</p>
            <h1 className="text-4xl font-black">Potit & finaali</h1>
            <p className="mt-1 text-sm font-bold text-white/55">Päivä, viikko, kuukausi ja porukan suuri potti.</p>
          </div>

          <Link to="/feed" className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 font-black">
            Feed
          </Link>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <PotCard title="Päiväpotti" icon="☀️" post={stats.daily} empty="Ei vielä päivän postauksia." note="Päiväarvonta / päivän näkyvyys" />
          <PotCard title="Viikkopotti" icon="🏆" post={stats.weekly} empty="Ei vielä viikon johtajaa." note="Eniten tykkäyksiä viikon päätteeksi" />
          <PotCard title="Kuukausipotti" icon="💎" post={stats.monthly} empty="Ei vielä kuukauden johtajaa." note="Kuukauden eniten tykkäyksiä" />
          <GroupPotCard group={stats.groupTop} />
        </section>

        <section className="mt-6 rounded-[34px] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
          <h2 className="text-2xl font-black">⚔️ Porukoiden tilanne</h2>
          <div className="mt-4 space-y-3">
            {stats.groupXp.slice(0, 10).map((group, index) => (
              <div key={group.id} className="flex items-center justify-between rounded-2xl bg-black/25 p-4">
                <div>
                  <div className="text-sm font-black text-white/45">#{index + 1}</div>
                  <div className="text-lg font-black">{group.name}</div>
                  <div className="text-xs font-bold text-white/45">{group.posts} postausta tässä syklissä</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-cyan-200">{group.xp}</div>
                  <div className="text-xs font-black text-white/45">XP</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[34px] border border-yellow-300/20 bg-yellow-400/10 p-5 shadow-2xl">
          <h2 className="text-2xl font-black text-yellow-100">📜 Pelin säännöt</h2>
          <div className="mt-4 space-y-2 text-sm font-bold text-white/75">
            {rules.map((rule, i) => (
              <div key={rule} className="rounded-2xl bg-black/20 p-3">
                {i + 1}. {rule}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function PotCard({ title, icon, post, empty, note }) {
  return (
    <div className="rounded-[34px] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
      <div className="text-4xl">{icon}</div>
      <h2 className="mt-3 text-2xl font-black">{title}</h2>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-white/45">{note}</p>

      {post ? (
        <div className="mt-5 rounded-3xl bg-black/25 p-4">
          <div className="text-sm font-black text-cyan-200">Johtava perustelu</div>
          <p className="mt-2 line-clamp-4 text-sm font-bold text-white/75">{post.content}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="rounded-full bg-pink-500/20 px-3 py-1 text-sm font-black text-pink-100">💗 {getVotes(post)}</span>
            <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-sm font-black text-cyan-100">AI {Math.round(post.ai_score || 0)}</span>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-3xl bg-black/25 p-4 text-sm font-bold text-white/55">{empty}</div>
      )}
    </div>
  );
}

function GroupPotCard({ group }) {
  return (
    <div className="rounded-[34px] border border-yellow-300/20 bg-yellow-400/10 p-5 shadow-2xl backdrop-blur-xl">
      <div className="text-4xl">👑</div>
      <h2 className="mt-3 text-2xl font-black">Suuri finaalipotti</h2>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-white/45">3 kuukauden sykli</p>

      {group ? (
        <div className="mt-5 rounded-3xl bg-black/25 p-4">
          <div className="text-sm font-black text-yellow-100">Johtava porukka</div>
          <div className="mt-2 text-3xl font-black">{group.name}</div>
          <div className="mt-4 text-4xl font-black text-yellow-200">{group.xp} XP</div>
          <p className="mt-2 text-sm font-bold text-white/60">Top-5 pelaajat finaaliäänestykseen.</p>
        </div>
      ) : (
        <div className="mt-5 rounded-3xl bg-black/25 p-4 text-sm font-bold text-white/55">Ei vielä porukoiden tilannetta.</div>
      )}
    </div>
  );
}
