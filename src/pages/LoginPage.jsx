import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
    });

    if (error) {
      setMessage("Virhe: " + error.message);
    } else {
      setMessage("Tarkista sähköposti ✉️");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={handleLogin}
        className="glass-card p-6 w-full max-w-md space-y-4"
      >
        <h1 className="text-2xl font-bold text-white">
          Kirjaudu sisään
        </h1>

        <input
          type="email"
          placeholder="Sähköposti"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-cyan-500 py-3 font-bold text-white"
        >
          {loading ? "Lähetetään..." : "Lähetä kirjautumislinkki"}
        </button>

        {message && (
          <p className="text-sm text-white/70">{message}</p>
        )}
      </form>
    </div>
  );
}
