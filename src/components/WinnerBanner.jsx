import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function WinnerBanner() {
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("latest_winners")
        .select("*")
        .limit(1);

      if (data && data.length > 0) {
        setWinner(data[0]);
      }
    };

    load();
  }, []);

  if (!winner) return null;

  return (
    <div className="bg-yellow-400 text-black p-4 rounded-xl mb-4">
      🏆 Päivän voittaja: {winner.username || "pelaaja"} voitti {winner.amount}€
    </div>
  );
}
