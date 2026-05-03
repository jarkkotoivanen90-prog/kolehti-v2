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

function AppShell() {
  const location = useLocation();

  useEffect(() => {
    let cleanHaptics = () => {};
    let cleanReactive = () => {};

    try { cleanHaptics = installGlobalHaptics?.() || (() => {}); } catch {}
    try { cleanReactive = installReactiveUI?.() || (() => {}); } catch {}
    try { startVersionCheck?.(); } catch {}

    return () => { try { cleanHaptics(); } catch {} try { cleanReactive(); } catch {} };
  }, []);

  const authPage = location.pathname === "/login" || location.pathname === "/reset";
  const isFeed = location.pathname === "/feed";

  return (
    <>
      <BrandFX />
      {!authPage && !isFeed && <Navbar />}

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

      {!authPage && !isFeed && <AppBottomNav floating gesture />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
