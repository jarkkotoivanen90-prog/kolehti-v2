import Header from "./Header";
import TopNav from "./TopNav";
import BottomNav from "./BottomNav";

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 opacity-40">
        <div className="absolute -top-24 left-10 h-72 w-72 rounded-full bg-cyan-400 blur-[120px]" />
        <div className="absolute top-40 right-10 h-80 w-80 rounded-full bg-fuchsia-500 blur-[140px]" />
        <div className="absolute bottom-10 left-1/3 h-72 w-72 rounded-full bg-emerald-400 blur-[140px]" />
      </div>
      <div className="relative z-10 pb-28">
        <Header />
        <TopNav />
        <main className="mx-auto mt-6 max-w-7xl px-4">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
