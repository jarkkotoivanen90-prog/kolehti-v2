import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import FeedPage from "./pages/FeedPage";
import NewPostPage from "./pages/NewPostPage";
import ProfilePage from "./pages/ProfilePage";

import AuthGate from "./components/auth/AuthGate";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/feed"
          element={
            <AuthGate>
              <FeedPage />
            </AuthGate>
          }
        />

        <Route
          path="/new"
          element={
            <AuthGate>
              <NewPostPage />
            </AuthGate>
          }
        />

        <Route
          path="/profile"
          element={
            <AuthGate>
              <ProfilePage />
            </AuthGate>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
