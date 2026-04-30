import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import AppBottomNav from "../components/AppBottomNav";
import { haptic } from "../lib/effects";

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
    const {data}=await supabase.from("posts").select("*").eq("user_id",user.id).order("created_at",{ascending:false}).limit(12);
    setPosts(data||[]);
  }

  const level = Math.max(1, Math.floor(xp/100));
  const progress = xp % 100;
  const visiblePosts = useMemo(()=>posts.slice(0,6),[posts]);

  return (
    <div className="profile-page min-h-screen text-white pb-[150px] px-4">
      <div className="max-w-md mx-auto pt-6">

        <h1 className="text-4xl font-black">Profiili</h1>
        <p className="text-white/50 mt-1 truncate">{user?.email}</p>

        <div className="suomi-card suomi-forest suomi-no-shine rounded-3xl p-4 mt-4">
          <div className="text-sm text-white/75">Oma XP-taso</div>
          <div className="mt-1 flex items-end justify-between gap-3">
            <div>
              <div className="text-4xl font-black">{xp} XP</div>
              <div className="text-sm font-black text-cyan-100">Level {level}</div>
            </div>
            <div className="rounded-2xl bg-black/35 px-4 py-3 text-center">
              <div className="text-2xl font-black">{progress}%</div>
              <div className="text-[10px] font-black uppercase text-white/45">seuraava</div>
            </div>
          </div>
          <div className="mt-4 h-3 bg-black/45 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-400 transition-all duration-500" style={{width:`${progress}%`}} />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Card label="Postaukset" value={posts.length}/>
          <Card label="Status" value="🔥 Aktiivinen"/>
        </div>

        <div className="mt-6 space-y-3">
          <button data-haptic="success" onClick={()=>haptic("success")} className="w-full suomi-card suomi-lake suomi-no-shine rounded-2xl p-4 text-left font-bold">⚙️ Sovelluksen asetukset</button>
          <button data-haptic="success" onClick={()=>haptic("success")} className="w-full suomi-card suomi-aurora suomi-no-shine rounded-2xl p-4 text-left font-bold">🎨 Muokkaa profiilia</button>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-black mb-3">Omat postaukset</h2>
          <div className="space-y-3">
            {visiblePosts.map(p=>(
              <div key={p.id} className="profile-lite-card rounded-2xl border border-white/10 bg-white/[0.075] p-4 shadow-xl shadow-black/20">
                <p className="line-clamp-4 text-white/86">{p.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AppBottomNav/>
    </div>
  );
}

function Card({label,value}){
  return(
    <div className="suomi-card suomi-lake suomi-no-shine rounded-2xl p-4">
      <div className="text-white/65 text-xs">{label}</div>
      <div className="text-2xl font-black mt-1">{value}</div>
    </div>
  )
}
