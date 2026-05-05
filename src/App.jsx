import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { installGlobalHaptics, installReactiveUI } from "./lib/effects";
import { startVersionCheck } from "./lib/versionCheck";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import FeedPage from "./features/feed/FeedScreen";
import NewPostPage from "./pages/NewPostPage";
import ProfilePage from "./pages/ProfilePageClean";
import GroupPage from "./pages/GroupPage";
import GrowthPage from "./pages/GrowthPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import PotsPage from "./pages/PotsPage";
import LeaderboardWarPage from "./pages/LeaderboardWarPage";

import AuthGate from "./components/auth/AuthGate";
import Navbar from "./components/Navbar";
import BrandFX from "./components/BrandFX";
import AppBottomNav from "./components/AppBottomNav";
import AdaptiveBackground from "./components/AdaptiveBackground";

// 🔥 NEW OVERLAYS
import XPOverlay from "./components/XPOverlay";
import RankUpOverlay from "./components/RankUpOverlay";
import TargetOverlay from "./components/TargetOverlay";

function AppShell() {
  const location = useLocation();

  useEffect(() => {
    let cleanHaptics = () => {};
    let cleanReactive = () => {};

    try { cleanHaptics = installGlobalHaptics?.() || (() => {}); } catch {}
    try { cleanReactive = installReactiveUI?.() || (() => {}); } catch {}
    try { startVersionCheck?.(); } catch {}

    return () => {
      try { cleanHaptics(); } catch {}
      try { cleanReactive(); } catch {}
    };
  }, []);

  const authPage =
    location.pathname === "/login" ||
    location.pathname === "/reset";

  const isHome = location.pathname === "/";
  const isFeed = location.pathname === "/feed";

  const showCityBackground = !isHome && !isFeed;

  return (
    <div
      className={
        showCityBackground
          ? "kolehti-city-bg-active min-h-[100dvh] bg-transparent"
          : undefined
      }
    >
      {/* 🌆 CITY BACKGROUND */}
      {showCityBackground && (
        <>
          <style>{`
            .kolehti-city-bg-active [class*="bg-[#050816]"],
            .kolehti-city-bg-active [class*="bg-\\[\\#050816\\]"],
            .kolehti-city-bg-active [class*="bg-[radial-gradient"],
            .kolehti-city-bg-active [class*="bg-\\[radial-gradient"] {
              background: transparent !important;
              background-color: transparent !important;
              background-image: none !important;
            }
          `}</style>

          <AdaptiveBackground strength="balanced" />
        </>
      )}

      <BrandFX />

      {/* 🧭 NAVBAR */}
      {!authPage && !isFeed && <Navbar />}

      {/* 🧠 ROUTES */}
      <div className="relative z-10">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset" element={<ResetPasswordPage />} />
          <Route path="/feed" element={<AuthGate><FeedPage /></AuthGate>} />
          <Route path="/vote" element={<Navigate to="/feed" replace />} />
          <Route path="/new" element={<AuthGate><NewPostPage /></AuthGate>} />
          <Route path="/groups" element={<AuthGate><GroupPage /></AuthGate>} />
          <Route path="/profile" element={<AuthGate><ProfilePage /></AuthGate>} />
          <Route path="/growth" element={<AuthGate><GrowthPage /></AuthGate>} />
          <Route path="/leaderboard" element={<AuthGate><LeaderboardPage /></AuthGate>} />
          <Route path="/pots" element={<AuthGate><PotsPage /></AuthGate>} />
          <Route path="/war" element={<AuthGate><LeaderboardWarPage /></AuthGate>} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </div>

      {/* 🔥 GLOBAL GAME LAYER (EI RIKO FEEDIÄ) */}
      <XPOverlay />
      <RankUpOverlay />

      {/* 🎯 TARGET EI NÄY FEEDISSÄ */}
      {!authPage && !isFeed && <TargetOverlay />}

      {/* 📱 BOTTOM NAV */}
      {!authPage && !isFeed && <AppBottomNav floating gesture />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
