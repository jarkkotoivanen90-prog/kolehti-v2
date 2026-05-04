import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import AdaptiveBackground from "../components/AdaptiveBackground";
import { haptic } from "../lib/effects";

const BG = "https://commons.wikimedia.org/wiki/Special:FilePath/Finnish_lake_and_forest_landscape_(175928795).jpg?width=1200";
const panel = "relative overflow-hidden rounded-[34px] border border-cyan-200/24 bg-white/[.035] bg-gradient-to-br from-[#0ea5ff]/14 via-[#0ea5ff]/7 to-transparent p-5 text-white shadow-[0_0_24px_rgba(14,165,255,.14),inset_0_1px_0_rgba(255,255,255,.08)] backdrop-blur-[6px]";
const innerPanel = "relative overflow-hidden rounded-[24px] border border-cyan-200/30 bg-white/[.04] bg-gradient-to-br from-[#0ea5ff]/22 via-[#0ea5ff]/12 to-transparent shadow-[0_0_22px_rgba(14,165,255,.20),inset_0_1px_0_rgba(255,255,255,.08)] backdrop-blur-[8px]";

function Glow() {
  return <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,.08),transparent_45%)]" />;
}

export default function GroupPage() {
  return (
    <div className="relative h-[100dvh] overflow-y-auto overflow-x-hidden bg-[#050816] text-white touch-pan-y overscroll-y-contain [-webkit-overflow-scrolling:touch]">
      <AdaptiveBackground src={BG} strength="balanced" />

      <main className="relative z-10 mx-auto max-w-md px-4 pb-[230px] pt-6">
        <div className={`${panel}`}>
          <Glow />
          <div className="relative text-center">
            <h1 className="text-2xl font-black">Scroll toimii taas 🎉</h1>
            <p className="mt-2 text-sm text-white/70">Build fixattu. Seuraavaksi palautetaan data ja UI.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
