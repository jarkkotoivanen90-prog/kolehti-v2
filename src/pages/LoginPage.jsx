import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Tarkista sähköposti (magic link)");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      <div className="glass-card p-6 w-full max-w-md">
        <h1 className="text-2xl mb-4">Kirjaudu</h1>

        <input
          type="email"
          placeholder="Sähköposti"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 rounded bg-white/10 mb-4"
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full p-3 bg-cyan-500 rounded"
        >
          {loading ? "Ladataan..." : "Lähetä kirjautumislinkki"}
        </button>
      </div>
    </div>
  );
}
