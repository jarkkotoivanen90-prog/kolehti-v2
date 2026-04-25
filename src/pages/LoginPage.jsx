import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const action =
      mode === "login"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });

    const { error } = await action;

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    navigate("/feed");
  }

  return (
    <div className="min-h-screen flex items-center justify-center text-white px-4">
      <form
        onSubmit={handleSubmit}
        className="glass-card p-6 w-full max-w-md space-y-4"
      >
        <h1 className="text-2xl font-bold">
          {mode === "login" ? "Kirjaudu" : "Luo tili"}
        </h1>

        <input
          type="email"
          placeholder="Sähköposti"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-3 rounded bg-white/10 border border-white/10"
        />

        <input
          type="password"
          placeholder="Salasana"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full p-3 rounded bg-white/10 border border-white/10"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 bg-cyan-500 rounded font-bold disabled:opacity-60"
        >
          {loading
            ? "Ladataan..."
            : mode === "login"
            ? "Kirjaudu"
            : "Luo tili"}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="text-sm text-cyan-200"
        >
          {mode === "login"
            ? "Ei tiliä? Luo uusi"
            : "Onko jo tili? Kirjaudu"}
        </button>
      </form>
    </div>
  );
}
