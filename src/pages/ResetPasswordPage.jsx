import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function updatePassword(e) {
    e.preventDefault();

    if (password.length < 6) {
      alert("Salasanan pitää olla vähintään 6 merkkiä.");
      return;
    }

    if (password !== confirm) {
      alert("Salasanat eivät täsmää.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Salasana vaihdettu onnistuneesti.");
    navigate("/feed");
  }

  return (
    <div className="min-h-screen bg-[#050816] px-4 py-10 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#153b92_0%,#050816_45%,#02030a_100%)]" />

      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-[28px] bg-cyan-500 text-5xl shadow-2xl shadow-cyan-500/30">
            🔐
          </div>

          <h1 className="mt-5 text-4xl font-black">Uusi salasana</h1>

          <p className="mt-2 text-sm font-semibold text-white/60">
            Luo uusi salasana KOLEHTI-tilillesi.
          </p>
        </div>

        <form
          onSubmit={updatePassword}
          className="rounded-[34px] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl"
        >
          <label className="text-sm font-black text-cyan-200">
            Uusi salasana
          </label>

          <input
            type="password"
            placeholder="Kirjoita uusi salasana"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-white outline-none placeholder:text-white/35"
          />

          <label className="mt-5 block text-sm font-black text-cyan-200">
            Vahvista salasana
          </label>

          <input
            type="password"
            placeholder="Kirjoita salasana uudelleen"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-white outline-none placeholder:text-white/35"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-cyan-500 px-5 py-4 text-lg font-black text-white shadow-xl shadow-cyan-500/25 disabled:opacity-50"
          >
            {loading ? "Tallennetaan..." : "Vaihda salasana"}
          </button>

          <Link
            to="/login"
            className="mt-5 block text-center text-sm font-bold text-cyan-200"
          >
            Takaisin kirjautumiseen
          </Link>
        </form>
      </div>
    </div>
  );
}
