import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

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

    setUser(user || null);

    const { data: groupsData, error: groupsError } = await supabase
      .from("groups")
      .select("*")
      .order("created_at", { ascending: false });

    if (groupsError) alert(groupsError.message);
    setGroups(groupsData || []);

    if (user) {
      const { data: memberData, error: memberError } = await supabase
        .from("group_members")
        .select("*")
        .eq("user_id", user.id)
        .eq("active", true);

      if (memberError) alert(memberError.message);
      setMemberships(memberData || []);
    }

    setLoading(false);
  }

  function isJoined(groupId) {
    return memberships.some((m) => m.group_id === groupId);
  }

  async function createGroup() {
    if (!user) {
      alert("Kirjaudu ensin.");
      navigate("/login");
      return;
    }

    if (!name.trim()) {
      alert("Anna porukan nimi.");
      return;
    }

    const { data: group, error } = await supabase
      .from("groups")
      .insert({ name: name.trim() })
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    const { error: memberError } = await supabase
      .from("group_members")
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: "owner",
        active: true,
      });

    if (memberError) {
      alert(memberError.message);
      return;
    }

    localStorage.setItem("kolehti_group_id", group.id);
    navigate("/feed");
  }

  async function joinGroup(groupId) {
    if (!user) {
      alert("Kirjaudu ensin.");
      navigate("/login");
      return;
    }

    const { error } = await supabase.from("group_members").upsert(
      {
        group_id: groupId,
        user_id: user.id,
        role: "member",
        active: true,
      },
      { onConflict: "group_id,user_id" }
    );

    if (error) {
      alert(error.message);
      return;
    }

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

    if (error) {
      alert(error.message);
      return;
    }

    if (localStorage.getItem("kolehti_group_id") === groupId) {
      localStorage.removeItem("kolehti_group_id");
    }

    await init();
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-6 text-white">
        Ladataan porukoita...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6 text-white">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Porukat</h1>
          <p className="mt-1 text-sm text-white/60">
            Luo porukka, liity porukkaan tai avaa oma ranking-feed.
          </p>
        </div>

        <Link
          to="/feed"
          className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold"
        >
          Feed
        </Link>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl">
        <h2 className="text-xl font-black">Luo uusi porukka</h2>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Porukan nimi"
            className="flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/40"
          />

          <button
            onClick={createGroup}
            className="rounded-2xl bg-cyan-500 px-5 py-3 font-bold text-white"
          >
            Luo porukka
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {groups.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
            Ei vielä porukoita.
          </div>
        ) : (
          groups.map((group) => {
            const joined = isJoined(group.id);

            return (
              <div
                key={group.id}
                className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-xl font-black">{group.name}</h3>
                    <p className="mt-1 text-sm text-white/50">
                      {joined
                        ? "Olet mukana tässä porukassa."
                        : "Voit liittyä tähän porukkaan."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {joined ? (
                      <>
                        <button
                          onClick={() => openGroup(group.id)}
                          className="rounded-2xl bg-pink-500 px-4 py-2 text-sm font-bold"
                        >
                          Avaa
                        </button>

                        <button
                          onClick={() => leaveGroup(group.id)}
                          className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold"
                        >
                          Poistu
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => joinGroup(group.id)}
                        className="rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-bold"
                      >
                        Liity
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
