import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const login = async (e) => {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithOtp({
      email,
    });

    if (error) setMsg(error.message);
    else setMsg("Tarkista sähköposti ✉️");
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Login</h1>

      <form onSubmit={login}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email"
        />
        <button type="submit">Login</button>
      </form>

      <p>{msg}</p>
    </div>
  );
}
