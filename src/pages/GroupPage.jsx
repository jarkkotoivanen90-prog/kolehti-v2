import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function GroupPage() {
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [myGroupIds, setMyGroupIds] = useState([]);
  const [name, setName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    init();
  }, []);

  async function init() {
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
        .select("group_id")
        .eq("user_id", user.id);

      setMyGroupIds((memberData || []).map((m) => m.group_id));
    }
  }

  async function createGroup() {
    if (!user) {
      alert("Kirjaudu ensin.");
      return;
    }

    if (!name.trim()) {
      alert("Anna porukalle nimi.");
      return;
    }

    const { data, error } = await supabase
      .from("groups")
      .insert({ name: name.trim() })
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    await joinGroup(data.id);
    setName("");
    await init();
  }

  async function joinGroup(groupId) {
    if (!user) {
      alert("Kirjaudu ensin.");
      return;
    }

    const { error } = await supabase.from("group_members").insert({
      group_id: groupId,
      user_id: user.id,
    });

    if (error && error.code !== "23505") {
      alert(error.message);
      return;
    }

    await init();
  }

  function openGroup(groupId) {
    localStorage.setItem("kolehti_group_id", groupId);
    navigate("/feed");
  }

  return (
    <div className="mx-auto max-w-3xl p-6 text-white">
      <h1 className="text-3xl font-black">Porukat</h1>
      <p className="mt-1 text-white/60">
        Luo porukka tai liity olemassa olevaan. Feed ja ranking suodattuvat porukan mukaan.
      </p>

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/10 p-5">
        <h2 className="text-xl font-black">Luo uusi porukka</h2>

        <div className="mt-4 flex gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Porukan nimi"
            className="flex-1 rounded-2xl border border-white/10 bg-white/10 px-4 py-3"
          />

          <button
            onClick={createGroup}
            className="rounded-2xl bg-cyan-500 px-5 py-3 font-bold"
          >
            Luo
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {groups.map((group) => {
          const joined = myGroupIds.includes(group.id);

          return (
            <div
              key={group.id}
              className="rounded-3xl border border-white/10 bg-white/10 p-5"
            >
              <h3 className="text-xl font-black">{group.name}</h3>

              <div className="mt-4 flex gap-3">
                {joined ? (
                  <button
                    onClick={() => openGroup(group.id)}
                    className="rounded-2xl bg-pink-500 px-4 py-2 font-bold"
                  >
                    Avaa porukka
                  </button>
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
          );
        })}
      </div>
    </div>
  );
}
