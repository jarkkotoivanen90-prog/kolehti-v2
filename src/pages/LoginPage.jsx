import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const { login, signup, isAuthenticated } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const target = location.state?.from || "/profile";

  if (isAuthenticated) {
    navigate(target, { replace: true });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(email, password);
      }

      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message || "Kirjautuminen epäonnistui");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10 text-white">
      <div className="rounded-[28px] border border-white/12 bg-white/8 p-6 backdrop-blur-xl">
        <div className="text-3xl font-black">Kolehti</div>
        <div className="mt-2 text-white/70">
          {mode === "login" ? "Kirjaudu sisään" : "Luo käyttäjätili"}
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-white/70">Sähköposti</label>
            <input
              className="w-full rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-white outline-none"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">Salasana</label>
            <input
              className="w-full rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-white outline-none"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <button
            disabled={busy}
            className="w-full rounded-2xl bg-cyan-300 px-4 py-3 font-bold text-black disabled:opacity-60"
            type="submit"
          >
            {busy
              ? "Odota..."
              : mode === "login"
              ? "Kirjaudu"
              : "Luo tili"}
          </button>
        </form>

        <button
          className="mt-4 text-sm text-cyan-200"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login"
            ? "Ei vielä tiliä? Luo käyttäjä"
            : "Onko sinulla jo tili? Kirjaudu"}
        </button>
      </div>
    </div>
  );
}
