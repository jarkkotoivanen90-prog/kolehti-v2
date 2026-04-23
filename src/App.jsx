import { Routes, Route } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import HomePage from "./pages/HomePage";
import FeedPage from "./pages/FeedPage";
import VotePage from "./pages/VotePage";
import NewPostPage from "./pages/NewPostPage";
import ProfilePage from "./pages/ProfilePage";
import ResultsPage from "./pages/ResultsPage";
import AdminDashboard from "./pages/AdminDashboard";
import NotificationStack from "./components/ui/NotificationStack";
import { useNotifications } from "./hooks/useNotifications";

export default function App() {
  const notifications = useNotifications();

  return (
    <>
      <NotificationStack notifications={notifications.notifications} onClose={notifications.remove} />
      <Routes>
        <Route path="/" element={<AppShell><HomePage notifications={notifications} /></AppShell>} />
        <Route path="/feed" element={<AppShell><FeedPage notifications={notifications} /></AppShell>} />
        <Route path="/vote" element={<AppShell><VotePage notifications={notifications} /></AppShell>} />
        <Route path="/new" element={<AppShell><NewPostPage notifications={notifications} /></AppShell>} />
        <Route path="/profile" element={<AppShell><ProfilePage notifications={notifications} /></AppShell>} />
        <Route path="/results" element={<AppShell><ResultsPage notifications={notifications} /></AppShell>} />
        <Route path="/admin/dashboard" element={<AppShell><AdminDashboard notifications={notifications} /></AppShell>} />
      </Routes>
    </>
  );
}
