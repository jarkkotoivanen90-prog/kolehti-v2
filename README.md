# Kolehti V2

Kolehti V2 on React + Vite + Tailwind + Supabase + Vercel -projekti.

## Käyttöönotto

1. Luo Supabase-projekti
2. Aja SQL:t järjestyksessä:
   - `sql/01_schema.sql`
   - `sql/02_policies.sql`
   - `sql/03_seed.sql` (valinnainen)
3. Kopioi `.env.example` -> `.env`
4. Lisää Supabase- ja mahdolliset OpenAI-avaimet
5. `npm install`
6. `npm run dev`

## Deploy

- Push GitHubiin
- Importtaa Verceliin
- Lisää envit Vercelin Project Settingsiin
- Jos käytät cron endpointteja, lisää myös `CRON_SECRET`

## Huomio

- AI feed, personalized feed, shadow moderation, growth ja Stripe membership ovat oletuksena pois päältä feature flageilla.
- OpenAI on valinnainen. Jos avain puuttuu, scoring ja moderation käyttävät fallback-logiikkaa.
