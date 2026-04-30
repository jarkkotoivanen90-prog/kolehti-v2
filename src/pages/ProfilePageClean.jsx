import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import AppBottomNav from "../components/AppBottomNav";

export default function ProfilePageClean() {
  const [user,setUser]=useState(null);
  const [posts,setPosts]=useState([]);
  const navigate=useNavigate();

  useEffect(()=>{load()},[]);

  async function load(){
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){navigate("/login");return}
    setUser(user);
    const {data}=await supabase.from("posts").select("*").eq("user_id",user.id);
    setPosts(data||[]);
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white pb-[140px] px-4">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#0f2c5f_0%,#050816_42%,#02030a_100%)]" />

      <div className="max-w-md mx-auto pt-6">
        <h1 className="text-4xl font-black">Profiili</h1>
        <p className="text-white/50 mt-1">{user?.email}</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Card label="Postaukset" value={posts.length}/>
          <Card label="Status" value="🔥 Aktiivinen"/>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-black mb-3">Omat postaukset</h2>
          {posts.map(p=>(
            <div key={p.id} className="mb-3 rounded-2xl bg-white/5 border border-white/10 p-4">
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
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <div className="text-white/50 text-xs">{label}</div>
      <div className="text-2xl font-black mt-1">{value}</div>
    </div>
  )
}
