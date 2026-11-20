# Portfolio Demo Setup

This copy is fully disconnected from the live resort application. It needs no database, authentication provider, API keys, or environment variables.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## How visitor data works

On first use, the app writes fictional seed data to the visitor's browser `localStorage`. Reservation, room, simulated-user, import, and audit-log changes update that local copy only. The **Reset demo** button replaces it with a fresh seed.

Because storage is per browser and origin:

- visitors cannot see or change each other's data;
- private/incognito sessions may discard changes when closed;
- clearing browser site data resets the demo;
- changing the deployed domain creates a separate local data set.

## Production build

```bash
npm run build
npm start
```

Never add the live application's `.env.local`, database credentials, or real guest data to this repository.
