import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleAuth(e) {
    e.preventDefault();

    if (!email || !password) {
      alert("Täytä sähköposti ja salasana.");
      return;
    }

    setLoading(true);

    let result;

    if (mode === "login") {
      result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
    } else {
      result = await supabase.auth.signUp({
        email,
        password,
      });
    }

    setLoading(false);

    if (result.error) {
      alert(result.error.message);
      return;
    }

    navigate("/groups");
  }

  async function sendResetLink() {
    if (!email) {
      alert("Syötä sähköposti ensin.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset`,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Salasanan vaihtolinkki lähetetty sähköpostiin.");
  }

  return (
    <div className="min-h-screen bg-[#050816] px-4 py-10 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#153b92_0%,#050816_45%,#02030a_100%)]" />

      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-[28px] bg-cyan-500 text-5xl shadow-2xl shadow-cyan-500/30">
            🤝
          </div>

          <h1 className="mt-5 text-5xl font-black">KOLEHTI</h1>

          <p className="mt-2 text-sm font-bold uppercase tracking-wide text-white/60">
            Me pidämme huolta – yhdessä voitamme.
          </p>
        </div>

        <form
          onSubmit={handleAuth}
          className="rounded-[34px] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl"
        >
          <h2 className="text-4xl font-black">
            {mode === "login" ? "Kirjaudu" : "Luo tili"}
          </h2>

          <label className="mt-6 block text-sm font-black text-cyan-200">
            Sähköposti
          </label>

          <input
            type="email"
            placeholder="sinun@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-white outline-none placeholder:text-white/35"
          />

          <label className="mt-5 block text-sm font-black text-cyan-200">
            Salasana
          </label>

          <input
            type="password"
            placeholder="Salasana"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-white outline-none placeholder:text-white/35"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-cyan-500 px-5 py-4 text-lg font-black text-white shadow-xl shadow-cyan-500/25 disabled:opacity-50"
          >
            {loading
              ? "Odota..."
              : mode === "login"
              ? "Kirjaudu"
              : "Luo tili"}
          </button>

          <button
            type="button"
            onClick={sendResetLink}
            disabled={loading}
            className="mt-5 block w-full text-left text-sm font-bold text-cyan-200 disabled:opacity-50"
          >
            Unohditko salasanan?
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="mt-4 block text-sm font-bold text-white/70"
          >
            {mode === "login"
              ? "Ei tiliä? Luo uusi"
              : "Onko sinulla jo tili? Kirjaudu"}
          </button>
        </form>
      </div>
    </div>
  );
}
