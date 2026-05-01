import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./next-level-ux.css";

// 🔥 HARD CACHE BUST + CLEANUP
(async () => {
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }

    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        await reg.unregister();
      }
    }
  } catch (e) {
    console.warn("cache cleanup failed", e);
  }
})();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
