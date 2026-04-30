export function startVersionCheck() {
  const LOCAL_KEY = "kolehti_app_version";

  async function check() {
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();

      const current = localStorage.getItem(LOCAL_KEY);

      if (!current) {
        localStorage.setItem(LOCAL_KEY, data.version);
        return;
      }

      if (current !== data.version) {
        showUpdateToast(() => {
          localStorage.setItem(LOCAL_KEY, data.version);
          window.location.reload(true);
        });
      }
    } catch (e) {
      console.warn("version check failed", e);
    }
  }

  setInterval(check, 15000);
  check();
}

function showUpdateToast(onReload) {
  const el = document.createElement("div");
  el.innerHTML = `
    <div style="
      position:fixed;
      bottom:120px;
      left:50%;
      transform:translateX(-50%);
      background:#0f172a;
      color:white;
      padding:14px 20px;
      border-radius:20px;
      font-weight:700;
      z-index:9999;
      box-shadow:0 10px 30px rgba(0,0,0,0.4);
      border:1px solid rgba(255,255,255,0.1);
    ">
      🚀 Uusi versio saatavilla
      <button style="margin-left:12px;background:#22c55e;border:none;padding:6px 10px;border-radius:10px;font-weight:800;color:black;" id="reloadBtn">
        Päivitä
      </button>
    </div>
  `;

  document.body.appendChild(el);

  el.querySelector("#reloadBtn").onclick = () => {
    onReload();
    el.remove();
  };
}
