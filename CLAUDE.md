# CLAUDE.md

## Commands

```bash
npm run dev
npm run build
npm run lint
npx tsc --noEmit
```

## Architecture

Next.js 15 App Router portfolio demo for resort room allocation. It is intentionally public and fully disconnected from the live resort application.

There is no authentication, middleware, external database, API route, or environment configuration. Do not add production credentials or real resort/guest data.

## Browser-local data

- `src/lib/demo-data.ts` creates fictional seed rooms, reservations, users, and audit data.
- `src/lib/demo-store.ts` owns all reads and writes to the `resort-portfolio-demo-v1` `localStorage` key.
- Each visitor and browser origin has an independent data set.
- Mutations dispatch `resort-demo-change` so open client components can refresh.
- The Reset demo action replaces local data with a fresh fictional seed.

## Room rack

`/rack/page.tsx` supplies a server-renderable fictional seed. `RoomRackClient.tsx` replaces it with the visitor's local copy after mount and provides the Gantt-style calendar. Reservation, room, simulated-user, import, and audit actions all use the local demo store.

All visitors intentionally receive admin-like demo access so every portfolio feature can be tested without credentials. Simulated users do not represent login accounts.
