export default function Header() {
  return (
    <header className="mx-auto max-w-7xl px-4 pt-5">
      <div className="glass-card-strong px-4 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-[22px] bg-gradient-to-br from-cyan-300 via-blue-400 to-indigo-600 text-3xl shadow-[0_0_34px_rgba(80,180,255,0.36)]">
              🤝
            </div>
            <div>
              <div className="text-4xl font-black tracking-tight">KOLEHTI</div>
              <div className="mt-1 text-sm text-white/70">
                Yhdessä voimme. Porukka pitää huolta.
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="pill">🇫🇮 Suomi</div>
            <div className="pill">🤖 AI V2</div>
          </div>
        </div>
      </div>
    </header>
  );
}
