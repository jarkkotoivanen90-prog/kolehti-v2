import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function GroupPage() {
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    init();
  }, []);

  async function init() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);

    const { data: groupsData } = await supabase
      .from("groups")
      .select("*")
      .order("created_at", { ascending: false });

    setGroups(groupsData || []);

    if (user) {
      const { data: memberData } = await supabase
        .from("group_members")
        .select("*")
        .eq("user_id", user.id)
        .eq("active", true);

      setMemberships(memberData || []);
    }

    setLoading(false);
  }

  function isJoined(groupId) {
    return memberships.some((m) => m.group_id === groupId);
  }

  async function createGroup() {
    if (!user) return alert("Kirjaudu ensin.");
    if (!name.trim()) return alert("Anna porukan nimi.");

    const { data: group, error } = await supabase
      .from("groups")
      .insert({ name: name.trim() })
      .select()
      .single();

    if (error) return alert(error.message);

    await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: user.id,
      role: "owner",
      active: true,
    });

    localStorage.setItem("kolehti_group_id", group.id);
    navigate("/feed");
  }

  async function joinGroup(groupId) {
    if (!user) return alert("Kirjaudu ensin.");

    const { error } = await supabase.from("group_members").upsert(
      {
        group_id: groupId,
        user_id: user.id,
        role: "member",
        active: true,
      },
      { onConflict: "group_id,user_id" }
    );

    if (error) return alert(error.message);

    localStorage.setItem("kolehti_group_id", groupId);
    navigate("/feed");
  }

  function openGroup(groupId) {
    localStorage.setItem("kolehti_group_id", groupId);
    navigate("/feed");
  }

  async function leaveGroup(groupId) {
    if (!user) return;

    const ok = confirm("Haluatko poistua porukasta?");
    if (!ok) return;

    const { error } = await supabase
      .from("group_members")
      .update({ active: false })
      .eq("group_id", groupId)
      .eq("user_id", user.id);

    if (error) return alert(error.message);

    if (localStorage.getItem("kolehti_group_id") === groupId) {
      localStorage.removeItem("kolehti_group_id");
    }

    await init();
  }

  if (loading) {
    return <div className="p-6 text-white">Ladataan porukoita...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl p-6 text-white">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Porukat</h1>
          <p className="mt-1 text-white/60">
            Luo porukka, liity porukkaan ja avaa oma ranking-feed.
          </p>
        </div>

        <button
          onClick={() => navigate("/feed")}
          className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 font-bold"
        >
          Feed
        </button>
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/10 p-5">
        <h2 className="text-xl font-black">Luo uusi porukka</h2>

        <div className="mt-4 flex gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Porukan nimi"
            className="flex-1 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none"
          />

          <button
            onClick={createGroup}
            className="rounded-2xl bg-cyan-500 px-5 py-3 font-bold"
          >
            Luo
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {groups.map((group) => {
          const joined = isJoined(group.id);

          return (
            <div
              key={group.id}
              className="rounded-3xl border border-white/10 bg-white/10 p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black">{group.name}</h3>
                  <p className="mt-1 text-sm text-white/50">
                    {joined ? "Olet mukana tässä porukassa." : "Voit liittyä tähän porukkaan."}
                  </p>
                </div>

                <div className="flex gap-2">
                  {joined ? (
                    <>
                      <button
                        onClick={() => openGroup(group.id)}
                        className="rounded-2xl bg-pink-500 px-4 py-2 font-bold"
                      >
                        Avaa
                      </button>

                      <button
                        onClick={() => leaveGroup(group.id)}
                        className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 font-bold"
                      >
                        Poistu
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => joinGroup(group.id)}
                      className="rounded-2xl bg-cyan-500 px-4 py-2 font-bold"
                    >
                      Liity
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
