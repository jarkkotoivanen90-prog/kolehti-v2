import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function GroupPage() {
  const [groups, setGroups] = useState([]);
  const [name, setName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase.from("groups").select("*");
    setGroups(data || []);
  }

  async function create() {
    const { data } = await supabase.from("groups").insert({ name }).select().single();

    localStorage.setItem("kolehti_group_id", data.id);
    navigate("/feed");
  }

  function open(id) {
    localStorage.setItem("kolehti_group_id", id);
    navigate("/feed");
  }

  return (
    <div className="p-6 text-white">
      <h1>Porukat</h1>

      <input value={name} onChange={e => setName(e.target.value)} />
      <button onClick={create}>Luo</button>

      {groups.map(g => (
        <div key={g.id}>
          <p>{g.name}</p>
          <button onClick={() => open(g.id)}>Avaa</button>
        </div>
      ))}
    </div>
  );
}
