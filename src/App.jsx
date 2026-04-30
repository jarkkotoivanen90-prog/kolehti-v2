import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { installGlobalHaptics, installReactiveUI } from "./lib/effects";
import { startVersionCheck } from "./lib/versionCheck";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import FeedPage from "./pages/FeedPageClean";
import VotePage from "./pages/VotePage";
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

function AppShell() {
  const location = useLocation();

  useEffect(() => {
    const cleanHaptics = installGlobalHaptics();
    const cleanReactive = installReactiveUI();
    startVersionCheck();
    return () => {
      cleanHaptics();
      cleanReactive();
    };
  }, []);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref) localStorage.setItem("kolehti_ref", ref);
    } catch {}
  }, [location.search]);

  const hideNavbar =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/reset";

  return (
    <>
      <BrandFX />
      {!hideNavbar && <Navbar />}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset" element={<ResetPasswordPage />} />

        <Route path="/feed" element={<AuthGate><FeedPage /></AuthGate>} />
        <Route path="/vote" element={<AuthGate><VotePage /></AuthGate>} />
        <Route path="/new" element={<AuthGate><NewPostPage /></AuthGate>} />
        <Route path="/groups" element={<AuthGate><GroupPage /></AuthGate>} />
        <Route path="/profile" element={<AuthGate><ProfilePage /></AuthGate>} />
        <Route path="/growth" element={<AuthGate><GrowthPage /></AuthGate>} />
        <Route path="/leaderboard" element={<AuthGate><LeaderboardPage /></AuthGate>} />
        <Route path="/pots" element={<AuthGate><PotsPage /></AuthGate>} />
        <Route path="/war" element={<AuthGate><LeaderboardWarPage /></AuthGate>} />

        <Route path="*" element={<HomePage />} />
      </Routes>
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
