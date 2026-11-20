# Resort Reservations — Portfolio Demo

An interactive, public-safe portfolio version of a room-allocation application built for a working resort.

## Demo safety

- No login or account is required.
- No Supabase project, production API, environment variable, or external database is used.
- All rooms, guests, users, and audit entries are fictional.
- Each visitor gets an independent data set in their own browser via `localStorage`.
- Changes never leave the visitor's device and cannot affect another visitor or the live resort.
- **Reset demo** restores the original fictional data at any time.

Browser storage is intentionally used for demonstration, not as a production database. Clearing site data or using another browser/device starts a fresh copy.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No environment file is needed.

## Verify

```bash
npm run build
npm run lint
```

## Deploy

This is a standard Next.js application and can be deployed as a public site without configuring database credentials. Do not add credentials from the live resort application to this repository or its hosting provider.
