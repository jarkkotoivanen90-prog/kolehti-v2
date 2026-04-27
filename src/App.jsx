import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import FeedPage from "./pages/FeedPage";
import VotePage from "./pages/VotePage";
import NewPostPage from "./pages/NewPostPage";
import ProfilePage from "./pages/ProfilePage";
import GroupPage from "./pages/GroupPage";
import GrowthPage from "./pages/GrowthPage";

import AuthGate from "./components/auth/AuthGate";
import Navbar from "./components/Navbar";

function AppShell() {
  const location = useLocation();

  const hideNavbar =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/reset";

  return (
    <>
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
