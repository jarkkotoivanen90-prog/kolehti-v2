import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import AdaptiveBackground from "../components/AdaptiveBackground";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleAuth(e) {
    e.preventDefault();

    if (!email.trim()) {
      alert("Syötä sähköposti.");
      return;
    }

    if (!password.trim()) {
      alert("Syötä salasana.");
      return;
    }

    setLoading(true);

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          })
        : await supabase.auth.signUp({
            email: email.trim(),
            password,
          });

    setLoading(false);

    if (result.error) {
      alert(result.error.message);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");

    if (ref && result.data?.user?.id) {
      await supabase.rpc("complete_referral", {
        invited_id: result.data.user.id,
        ref_code: ref,
      });
    }

    navigate("/groups");
  }

  async function sendResetLink() {
    if (!email.trim()) {
      alert("Syötä sähköposti ensin.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset`,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Salasanan vaihtolinkki lähetetty sähköpostiisi.");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] px-4 py-10 text-white">
      <AdaptiveBackground strength="balanced" />

      <div className="relative z-10 mx-auto max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-[32px] bg-cyan-500 text-6xl shadow-2xl shadow-cyan-500/30">
            🤝
          </div>

          <h1 className="mt-6 text-6xl font-black tracking-tight">KOLEHTI</h1>

          <p className="mt-3 text-sm font-bold uppercase tracking-wide text-white/55">
            Me pidämme huolta – yhdessä voitamme.
          </p>
        </div>

        <form
          onSubmit={handleAuth}
          className="rounded-[34px] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl"
        >
          <h2 className="text-5xl font-black">
            {mode === "login" ? "Kirjaudu" : "Luo tili"}
          </h2>

          <label className="mt-7 block text-sm font-black text-cyan-200">
            Sähköposti
          </label>

          <input
            type="email"
            placeholder="sinun@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
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
            autoComplete={mode === "login" ? "current-password" : "new-password"}
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

          {mode === "login" && (
            <button
              type="button"
              onClick={sendResetLink}
              disabled={loading}
              className="mt-5 block w-full text-left text-sm font-black text-cyan-200 disabled:opacity-50"
            >
              Unohditko salasanan?
            </button>
          )}

          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            disabled={loading}
            className="mt-4 block text-sm font-black text-white/60 disabled:opacity-50"
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
