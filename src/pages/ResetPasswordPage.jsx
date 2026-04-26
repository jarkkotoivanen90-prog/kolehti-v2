import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    checkResetSession();
  }, []);

  async function checkResetSession() {
    setChecking(true);

    const { data } = await supabase.auth.getSession();

    if (data?.session) {
      setReady(true);
      setMessage("");
    } else {
      setReady(false);
      setMessage(
        "Reset-linkki puuttuu, on vanhentunut tai sitä ei avattu samassa selaimessa."
      );
    }

    setChecking(false);
  }

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
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-[#050816] px-4 py-10 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#153b92_0%,#050816_45%,#02030a_100%)]" />

      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-[32px] bg-cyan-500 text-6xl shadow-2xl shadow-cyan-500/30">
            🔐
          </div>

          <h1 className="mt-6 text-5xl font-black">Uusi salasana</h1>

          <p className="mt-3 text-sm font-bold uppercase tracking-wide text-white/55">
            KOLEHTI · turvallinen tilin palautus
          </p>
        </div>

        <div className="rounded-[34px] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
          {checking ? (
            <div className="py-10 text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-cyan-300 border-t-transparent" />
              <p className="font-bold text-white/70">Tarkistetaan reset-linkkiä...</p>
            </div>
          ) : !ready ? (
            <div>
              <h2 className="text-3xl font-black">Linkki ei ole aktiivinen</h2>

              <p className="mt-4 text-sm leading-relaxed text-white/70">
                {message}
              </p>

              <div className="mt-5 rounded-2xl border border-yellow-300/20 bg-yellow-500/10 p-4 text-sm text-yellow-100">
                Avaa sähköpostista tullut reset-linkki samalla selaimella ja samalla laitteella.
                Jos linkki on vanhentunut, pyydä uusi kirjautumissivulta.
              </div>

              <Link
                to="/login"
                className="mt-6 block w-full rounded-2xl bg-cyan-500 px-5 py-4 text-center text-lg font-black text-white shadow-xl shadow-cyan-500/25"
              >
                Takaisin kirjautumiseen
              </Link>
            </div>
          ) : (
            <form onSubmit={updatePassword}>
              <h2 className="text-3xl font-black">Aseta uusi salasana</h2>

              <p className="mt-2 text-sm text-white/60">
                Kirjoita uusi salasana kahteen kertaan.
              </p>

              <label className="mt-6 block text-sm font-black text-cyan-200">
                Uusi salasana
              </label>

              <input
                type="password"
                placeholder="Vähintään 6 merkkiä"
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
          )}
        </div>
      </div>
    </div>
  );
}
