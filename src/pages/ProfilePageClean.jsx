import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import AppBottomNav from "../components/AppBottomNav";

export default function ProfilePageClean() {
  const [user,setUser]=useState(null);
  const [posts,setPosts]=useState([]);
  const [xp,setXp]=useState(320);
  const navigate=useNavigate();

  useEffect(()=>{load()},[]);

  async function load(){
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){navigate("/login");return}
    setUser(user);
    const {data}=await supabase.from("posts").select("*").eq("user_id",user.id);
    setPosts(data||[]);
  }

  const level = Math.floor(xp/100);
  const progress = (xp % 100);

  return (
    <div className="min-h-screen text-white pb-[140px] px-4">
      <div className="max-w-md mx-auto pt-6">

        <h1 className="text-4xl font-black">Profiili</h1>
        <p className="text-white/50 mt-1">{user?.email}</p>

        {/* XP CARD */}
        <div className="suomi-card suomi-forest rounded-3xl p-4 mt-4">
          <div className="text-sm text-white/70">Level {level}</div>
          <div className="text-3xl font-black">{xp} XP</div>
          <div className="mt-3 h-2 bg-black/40 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-400" style={{width:`${progress}%`}} />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Card label="Postaukset" value={posts.length}/>
          <Card label="Status" value="🔥 Aktiivinen"/>
        </div>

        {/* SETTINGS */}
        <div className="mt-6 space-y-3">
          <button className="w-full suomi-card suomi-lake rounded-2xl p-4 text-left font-bold">⚙️ Sovelluksen asetukset</button>
          <button className="w-full suomi-card suomi-aurora rounded-2xl p-4 text-left font-bold">🎨 Muokkaa profiilia</button>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-black mb-3">Omat postaukset</h2>
          {posts.map(p=>(
            <div key={p.id} className="mb-3 suomi-card suomi-road rounded-2xl p-4">
              {p.content}
            </div>
          ))}
        </div>
      </div>

      <AppBottomNav/>
    </div>
  );
}

function Card({label,value}){
  return(
    <div className="suomi-card suomi-lake rounded-2xl p-4">
      <div className="text-white/60 text-xs">{label}</div>
      <div className="text-2xl font-black mt-1">{value}</div>
    </div>
  )
}
