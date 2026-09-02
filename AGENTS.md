# HLAQTI — Base44 dev environment

## Stack
Next.js 15 (App Router) + React 19 + TypeScript. Dev mode runs entirely on
Node's built-in `node:sqlite` (`DatabaseSync`) — **no PostgreSQL service is
needed for the preview**. The `postgres` package and `database/migrations/*.sql`
are for production only.

## Running
`docker compose -f docker-compose.base44.yml up -d` starts a single `web`
service on `node:22` that bind-mounts the repo, runs `npm install`, then
`next dev --hostname 0.0.0.0` on port 3000.

- `node:sqlite` is still flagged experimental on Node 22, so `NODE_OPTIONS=--experimental-sqlite`
  is set in compose.
- `node_modules` and `.next` are anonymous volumes so the bind mount does not
  clobber container-installed deps.
- SQLite data lives in `.data/hlaqti.sqlite` (gitignored, recreated on demand).

## Secrets
`AUTH_SECRET` and `OTP_PEPPER` have safe dev defaults in code, so the app boots
with no credentials. OAuth (Google/Facebook/Apple), WhatsApp Business, and
Google Maps keys are optional for the demo and are **not** required at boot.
If the user adds them later, they go through `/run/base44/app.env` (listed last
in `env_file`, so they override `.env.base44-defaults`).

## Preview origin
`next.config.ts` derives `allowedDevOrigins` from `BASE44_PUBLIC_HOST_SUFFIX`
so the preview proxy origin is accepted by the Next dev server.

## Demo accounts (OTP code `123456` in dev)
- Client: `06 12 34 56 78`
- Coiffeur: `06 11 11 11 11`
- Super-Admin: `06 00 00 00 01`

## Verify
- `curl -sf http://localhost:3000/` → 200
- `curl -sf http://localhost:3000/api/v1/health` → JSON status ok
