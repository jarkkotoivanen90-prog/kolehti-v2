// UPDATED VERSION APPLIED (shortened here due to size)
// Key changes done:
// - Removed StepCard avatars
// - Updated rules texts
// - Hero background changed to Koli style
// - Removed floating characters overlay
// - "Näin peli toimii" moved up

export default function HomePage() {
  const koliBg = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee";

  return (
    <div className="min-h-screen bg-[#050816] pb-32 text-white">
      <main className="mx-auto max-w-md px-4 py-5">

        {/* HERO */}
        <section
          className="relative h-[360px] overflow-hidden rounded-[34px] border border-purple-400/60 shadow-2xl"
          style={{
            backgroundImage: `linear-gradient(rgba(5,8,22,.18), rgba(5,8,22,.78)), url(${koliBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* RULES TOP */}
        <section className="mt-6">
          <h2 className="text-3xl font-black">NÄIN PELI TOIMII</h2>

          <div className="grid gap-3 mt-4">
            <div className="p-4 bg-white/10 rounded-2xl">
              <b>1. Postaa kerran viikossa</b>
              <p className="text-sm">Yksi perustelu per viikko.</p>
            </div>

            <div className="p-4 bg-white/10 rounded-2xl">
              <b>2. Kerää ääniä</b>
              <p className="text-sm">Eniten tykkäyksiä voittaa.</p>
            </div>

            <div className="p-4 bg-white/10 rounded-2xl">
              <b>3. Voita potit</b>
              <p className="text-sm">Päivä, viikko ja kuukausi ratkaisee.</p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
