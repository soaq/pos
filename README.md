# Restaurant 3D Planner

Web-first prototype for scanning restaurant kitchens and turning equipment into editable layout objects.

## Stack

- Next.js
- Supabase
- Vercel
- Three.js-ready frontend

## Environment

Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tgoyekuadpmjrblfqqge.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Local

```bash
npm run dev
```

## Deploy

```bash
npx vercel
```

## Live Wiring

- Production: https://restaurant-3d-planner.vercel.app
- GitHub: https://github.com/soaq/pos
- Supabase: https://tgoyekuadpmjrblfqqge.supabase.co

GitHub-backed auto-deploys require the Vercel account to add GitHub as a login connection. CLI deploys already work.
