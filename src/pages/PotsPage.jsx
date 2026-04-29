import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function PotsPage() {
  const [time, setTime] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setTime(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ padding: 20, color: "white" }}>
      <h1>💰 Potit (korjattu)</h1>
      <p>App toimii taas.</p>
      <p>Aika: {new Date(time).toLocaleTimeString()}</p>
    </div>
  );
}
