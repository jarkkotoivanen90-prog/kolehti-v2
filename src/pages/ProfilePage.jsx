import { useAuth } from "../hooks/useAuth";

export default function ProfilePage() {
  const { user, profile, logout, loading } = useAuth();

  if (loading) {
    return <div className="p-6 text-white">Ladataan profiilia...</div>;
  }

  if (!user) {
    return <div className="p-6 text-white">Et ole kirjautunut.</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 text-white">
      <div className="rounded-[28px] border border-white/12 bg-white/8 p-6 backdrop-blur-xl">
        <div className="text-2xl font-black">{profile?.display_name || "Käyttäjä"}</div>
        <div className="mt-2 text-white/70">{user.email}</div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white/6 p-4">
            <div className="text-xs text-white/60">Trust level</div>
            <div className="mt-1 text-xl font-bold">{profile?.trust_level || "new"}</div>
          </div>
          <div className="rounded-2xl bg-white/6 p-4">
            <div className="text-xs text-white/60">Reputation</div>
            <div className="mt-1 text-xl font-bold">{profile?.reputation_score ?? 0.5}</div>
          </div>
          <div className="rounded-2xl bg-white/6 p-4">
            <div className="text-xs text-white/60">Invite code</div>
            <div className="mt-1 text-xl font-bold">{profile?.invite_code || "-"}</div>
          </div>
        </div>

        <button
          onClick={logout}
          className="mt-6 rounded-2xl border border-white/12 bg-white/8 px-4 py-3 font-semibold"
        >
          Kirjaudu ulos
        </button>
      </div>
    </div>
  );
}
