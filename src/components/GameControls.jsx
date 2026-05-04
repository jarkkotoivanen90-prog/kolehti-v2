import { startCheckout } from "../lib/paymentsMock";
import { supabase } from "../lib/supabaseClient";

export default function GameControls({ postId }) {

  const handleDailyEntry = async () => {
    const res = await startCheckout("daily_entry");
    console.log("ENTRY RESULT", res);
  };

  const handleBoost = async () => {
    console.log("BOOST CLICK", postId);
    await supabase.functions.invoke("buy-boost", {
      body: { post_id: postId }
    });
  };

  return (
    <div className="flex gap-3 mt-4">
      <button onClick={handleDailyEntry} className="bg-green-500 px-4 py-2 rounded-xl text-white font-bold">
        Osallistu (5€)
      </button>

      <button onClick={handleBoost} className="bg-purple-500 px-4 py-2 rounded-xl text-white font-bold">
        Boost 🔥
      </button>
    </div>
  );
}
