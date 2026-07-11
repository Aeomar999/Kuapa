# Kuapa AgriMarket — End-to-End Deployment Manual

> Deploy the **backend API** to Railway, the **database** to Neon, the **admin portal** to Vercel, and the **Android APK** via Expo EAS — from a cold start to a working production system.
>
> This manual is written for **this repository exactly as it is today**. Every command, path, and variable name matches the real code. Copy-paste friendly. Windows-first (PowerShell), with notes where Bash differs.

---

## 0. Architecture at a glance

```
┌──────────────┐        HTTPS /api/v1        ┌────────────────────────┐
│  Mobile APK  │ ─────────────────────────▶  │                        │
│ (Expo/EAS)   │        WSS  (socket.io)     │   Railway Service      │
└──────────────┘ ─────────────────────────▶  │   NestJS API server    │
                                             │   node dist/main       │
┌──────────────┐        HTTPS /api/v1        │   binds 0.0.0.0:$PORT  │
│ Admin portal │ ─────────────────────────▶  │                        │
│ (Next.js)    │        WSS  (socket.io)     └───────────┬────────────┘
└──────────────┘                                         │ Prisma 7 (pg adapter)
                                                         │ DATABASE_URL (SSL)
                                             ┌───────────▼────────────┐
                                             │   Neon Postgres        │
                                             └────────────────────────┘

External services wired via env vars:
  Cloudinary (images) · Paystack (payments) · Better Auth Cloud (auth infra)
  Sentry (errors) · PostHog (analytics/flags) · Arkesel (SMS) · SMTP (email)
  Google Maps Platform (routing/geocoding)
```

**Key facts baked into the code (do not fight these):**

| Fact | Where it's set | Value |
|---|---|---|
| Server listens on | `apps/server/src/main.ts` | `0.0.0.0`, port `process.env.PORT ?? 3000` |
| Global route prefix | `main.ts` `setGlobalPrefix("api")` + URI versioning v1 | `/api/v1/...` |
| Health check | `apps/server/src/modules/health/health.controller.ts` | `GET /api/v1/health` |
| Auth base URL | `apps/server/src/auth/better-auth.ts` | `${BETTER_AUTH_URL}/api/v1/auth` |
| DB connection | `apps/server/src/prisma/prisma.service.ts` | pg adapter from `DATABASE_URL` |
| Migrations DB URL | `apps/server/prisma.config.ts` | `process.env.DATABASE_URL` |
| Admin dev port | `apps/admin/package.json` | `3001` |
| Mobile scheme | `apps/mobile/app.json` | `kuapa://` |

> **Repo root note:** the git repository is the inner folder `Kuapa/Kuapa/` (the one containing `apps/`, `packages/`, and the root `package.json`). That folder is what you push to GitHub and what Railway/Vercel treat as the repository root. The apps are **not** npm workspaces — each of `apps/server`, `apps/admin`, `apps/mobile` has its own `package.json` and lockfile and installs independently.

---

## 1. Pre-flight fixes (do these BEFORE deploying)

These are real inconsistencies in the repo right now. Skipping them produces a "deployed but broken" system.

### 1.1 — Standardize the production backend URL

The admin points at `kuapa-production.up.railway.app` but `eas.json` (mobile) still points at the **old** `bexiemart-production.up.railway.app`. Pick your **final Railway domain** (you'll create/confirm it in Part 3) and use it everywhere. Suggested: `https://kuapa-production.up.railway.app`.

Files to update once you know the final domain:
- `apps/mobile/eas.json` → every `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_SOCKET_URL`
- `apps/mobile/.env` → `EXPO_PUBLIC_API_URL`
- `apps/admin/.env.local` → `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL` (and the same as Vercel env vars)
- Railway server var `BETTER_AUTH_URL` and `CORS_ORIGIN`

### 1.2 — Fix mobile deep-link scheme (breaks email verification on Android)

`apps/server/src/auth/better-auth.ts` sends verification deep links as **`kuapa://verify-email`**, but `apps/mobile/app.json` still registers Android intent filters for **`bexiemart://`** and `applinks:bexiemart.com`. Tapping "verify" in the email will not open the app.

In `apps/mobile/app.json`, update the Android `intentFilters` and iOS `associatedDomains`:
- `scheme: "bexiemart"` → `scheme: "kuapa"` (the deep-link intent filter block)
- `host: "bexiemart.com"` → your real domain (e.g. `kuapa.com`) for the `https` App Links filter
- `associatedDomains: ["applinks:bexiemart.com"]` → `["applinks:kuapa.com"]`

**✅ Store identity renamed to `com.kuapa.app`** (applied across the repo):
- `apps/mobile/app.json` — `ios.bundleIdentifier` + `android.package` → `com.kuapa.app`
- `apps/mobile/src/lib/api/better-auth.ts` — client `Origin` header → `com.kuapa.app://`, expo `scheme`/`storagePrefix` → `kuapa`
- `apps/server/src/auth/better-auth.ts` — `trustedOrigins` now lists `com.kuapa.app://` (dead `bexiemart://` / `com.bexiemart.app://` removed)
- `apps/server/public/.well-known/assetlinks.json` (Android) + `apple-app-site-association` (iOS) — `package_name` / `appID` → `com.kuapa.app`

> ⚠️ **After the first EAS build of the renamed Android app**, the app is signed with a **new keystore**, so the `sha256_cert_fingerprints` in `assetlinks.json` is now stale. Get the new fingerprint with `eas credentials` (Android → production) and replace it, then redeploy the server so `https://<domain>/.well-known/assetlinks.json` matches — otherwise Android App Links (`https://kuapa.com/...`) won't auto-verify. The iOS AASA `appID` still has a `TEAMID.` placeholder — swap in your Apple Team ID.

### 1.3 — Fill Google Maps native keys (or the maps screens crash on device)

`apps/mobile/app.json` has `REPLACE_WITH_GOOGLE_MAPS_IOS_KEY` and `REPLACE_WITH_GOOGLE_MAPS_ANDROID_KEY`. Create **Maps SDK for Android** / **Maps SDK for iOS** keys in the Google Cloud Console (restrict each by app package/bundle + SHA-1) and paste them in before an EAS build.

### 1.4 — Know your build-time devDependencies

The server build runs `prisma generate` and `nest build`; `prisma`, `@nestjs/cli`, and `ts-node` all live in **devDependencies**. If you set `NODE_ENV=production` on Railway, npm would skip them and the build fails with `nest: not found` / `prisma: not found`. The fix (also set `NPM_CONFIG_PRODUCTION=false`) is in §4.4 — just be aware now.

---

## 2. Accounts & tooling you need

Create these accounts (all have free tiers sufficient to launch):

| Service | Purpose | Sign up |
|---|---|---|
| **Neon** | Postgres database | https://neon.tech |
| **Railway** | Backend API hosting | https://railway.com |
| **Vercel** | Admin portal hosting | https://vercel.com |
| **Expo (EAS)** | Mobile builds → APK | https://expo.dev |
| **Better Auth Cloud** | Auth infra (`dash`/`sentinel` plugins need an API key) | https://better-auth.com |
| **Cloudinary** | Image storage/CDN | https://cloudinary.com |
| **Paystack** | Payments (Ghana) | https://paystack.com |
| **Sentry** | Error monitoring | https://sentry.io |
| **PostHog** | Analytics + feature flags | https://posthog.com |
| **Arkesel** | SMS OTP (Ghana) | https://arkesel.com |
| **Google Cloud** | Maps Platform + (optional) Google OAuth | https://console.cloud.google.com |
| **GitHub** | Source repo Railway/Vercel deploy from | https://github.com |

Local CLIs (install on your machine):

```powershell
# Node 22 LTS recommended (server targets @types/node ^22)
node --version

# Railway CLI
npm i -g @railway/cli

# EAS / Expo CLI
npm i -g eas-cli

# Vercel CLI (optional — you can use the dashboard instead)
npm i -g vercel

# Prisma is already a devDependency of apps/server; run it via npm scripts.
```

Push the repo to GitHub first (Railway and Vercel deploy from a Git repo):

```powershell
cd "C:\Users\Jerry\Desktop\PROJECT 2026\Kuapa\Kuapa"
git status                      # confirm this is the repo root (apps/, packages/ present)
# create a private repo on GitHub, then:
git remote add origin https://github.com/<you>/kuapa.git   # if not already set
git push -u origin main
```

> `.env`, `.env.local`, `.env.production` are gitignored — secrets stay local. You will re-enter them in each platform's dashboard.

---

## 3. PART A — Database on Neon

### 3.1 — Create the project & database

1. Log in to https://console.neon.tech → **New Project**.
2. Name: `kuapa`. Region: pick the closest to your Railway region (e.g. **AWS eu-central-1 / Frankfurt** if your users/Sentry are EU, or a US region — keep Railway and Neon in the same region to cut latency).
3. Postgres version: 16+ is fine. Default database name: `neondb` (or `kuapa`).

### 3.2 — Grab the connection string

In the Neon dashboard → **Connection Details**, copy the connection string. It looks like:

```
postgresql://<user>:<password>@ep-xxxx-xxxx.<region>.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

Neon offers **two** endpoints via a toggle:
- **Direct** (host like `ep-xxxx-xxxx`) — use this for **migrations** and for this app's **runtime**.
- **Pooled** (host contains `-pooler`) — for serverless/many-instance apps.

**Recommendation for Kuapa:** the NestJS server is a **single long-lived process** that keeps its own pg connection pool (via `@prisma/adapter-pg`). Use the **direct** connection string for `DATABASE_URL` — it avoids PgBouncer prepared-statement quirks and one URL works for both runtime and migrations. If you later scale to many server replicas, switch runtime to the pooled endpoint and keep the direct endpoint for migrations.

Keep the `?sslmode=require` (Neon requires TLS; node-postgres reads it from the URL). Save this full string — you'll paste it into Railway (`DATABASE_URL`) and use it locally for the first migration.

### 3.3 — Run the initial migration (from your machine)

Migrations are **not** part of the Railway build, so run them once against Neon before/right after the first server deploy. The repo has real migrations in `apps/server/prisma/migrations/` (`0_init`, support tickets, escrow, super-admin, banners).

```powershell
cd "C:\Users\Jerry\Desktop\PROJECT 2026\Kuapa\Kuapa\apps\server"

# Point DATABASE_URL at Neon for this shell only (do NOT commit this):
$env:DATABASE_URL = "postgresql://<user>:<pw>@ep-xxxx.<region>.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

npm install --legacy-peer-deps        # if you haven't already
npm run prisma:generate               # generate the Prisma client
npm run prisma:deploy                 # = prisma migrate deploy  → applies all migrations
```

Bash equivalent for the env line: `export DATABASE_URL="postgresql://..."`.

Verify the tables exist:

```powershell
npm run prisma:studio                 # opens Prisma Studio against Neon
```

> If you ever need to reset a fresh Neon branch to schema without migration history: `npm run prisma:push` (uses `db push`). Prefer `prisma:deploy` for production so history stays intact.

### 3.4 — (Optional) Neon branching for staging

Neon lets you create a **branch** of the database (instant copy-on-write). Create a `staging` branch and use its connection string for a Railway staging environment. Free tier includes limited branches; the main/production branch is what Railway production uses.

> **Free-tier note:** Neon autosuspends compute after ~5 min idle. The first request after idle incurs a cold start (a few hundred ms). Railway's health check hitting `/api/v1/health` (which pings the DB) keeps it reasonably warm. Upgrade the Neon plan to disable autosuspend for production.

---

## 4. PART B — Backend API on Railway

### 4.1 — Create the project & service

**Option 1 — Dashboard (recommended, GitHub-connected → auto-deploys on push):**
1. https://railway.com → **New Project** → **Deploy from GitHub repo** → select your `kuapa` repo.
2. Railway creates a service. Open it → **Settings**:
   - **Root Directory**: leave as `/` (repo root). The root `package.json` `build`/`start` scripts drive the server:
     - `build` → `npm --prefix apps/server install --legacy-peer-deps && npm --prefix apps/server run prisma:generate && npm --prefix apps/server run build`
     - `start` → `npm --prefix apps/server run start:prod` → `node dist/main`
   - Railway (Nixpacks) auto-detects Node and uses those scripts. No Dockerfile needed.
3. Rename the service to `kuapa-api` (or keep default) and, under **Settings → Networking → Public Networking**, **Generate Domain**. Note the domain (e.g. `kuapa-production.up.railway.app`) — this is your production API URL and drives §1.1.

**Option 2 — CLI (deploy the current directory):**
```powershell
cd "C:\Users\Jerry\Desktop\PROJECT 2026\Kuapa\Kuapa"
railway login                 # opens browser
railway init --name kuapa     # create project
railway up                    # build & deploy current directory
railway domain                # generate/get the public domain
```

> The CLI `railway up` returns when the build is *queued*. Confirm success with `railway deployment list --json` (status `SUCCESS`) or watch logs with `railway logs`.

### 4.2 — Set the environment variables

In the service → **Variables**, add every variable below. Railway offers a **Raw Editor** — paste the block, then replace the placeholder values.

**Core / server:**
```
NODE_ENV=production
NPM_CONFIG_PRODUCTION=false          # keeps devDeps (prisma, nest CLI, ts-node) available at build — see §4.4
PORT=                                 # LEAVE UNSET — Railway injects PORT automatically
CLIENT_URL=https://kuapa-admin.vercel.app
WEB_URL=https://kuapa-admin.vercel.app
CORS_ORIGIN=https://kuapa-admin.vercel.app,https://admin.kuapa.com,https://kuapa.com
LOG_LEVEL=log
```

**Database (Neon direct connection from §3.2):**
```
DATABASE_URL=postgresql://<user>:<pw>@ep-xxxx.<region>.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Better Auth:**
```
BETTER_AUTH_SECRET=<64+ char random string>        # generate: see §4.3
BETTER_AUTH_URL=https://kuapa-production.up.railway.app   # your Railway domain, NO trailing /api
BETTER_AUTH_API_KEY=<key from better-auth.com dashboard>  # REQUIRED (code uses apiKey!) — dash+sentinel plugins
# Optional (only if Better Auth Cloud gives you custom endpoints):
# BETTER_AUTH_API_URL=https://api.better-auth.com
# BETTER_AUTH_KV_URL=https://kv.better-auth.com
```

**Google OAuth (Sign in with Google) — optional but wired:**
```
GOOGLE_CLIENT_ID=<id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<secret>
```

**Payments (Paystack) — use LIVE keys for real money:**
```
PAYSTACK_SECRET_KEY=sk_live_xxx        # sk_test_xxx while testing
```

**Images (Cloudinary):**
```
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
```

**Email (SMTP — Gmail example; use an App Password, not your login):**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=<your_email>
SMTP_PASS=<gmail_app_password>
EMAIL_FROM=Kuapa AgriMarket <no-reply@kuapa.com>
```

**SMS OTP (Arkesel — Ghana):**
```
ARKESEL_API_KEY=<key>
ARKESEL_SENDER_ID=Kuapa            # must be an approved sender ID (≤11 chars)
```

**Error monitoring (Sentry — server DSN, separate from the mobile DSN):**
```
SENTRY_DSN=<server_sentry_dsn>
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
```

**Maps (server-side routing/geocoding — optional; falls back to straight-line if unset):**
```
GOOGLE_MAPS_API_KEY=<server_maps_key_restricted_by_API+IP>
```

> Do **not** set `DEV_EMAIL_HOST` in production (it's a dev-only LAN rewrite helper).

### 4.3 — Generate `BETTER_AUTH_SECRET`

```powershell
# PowerShell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Max 256 }))
```
```bash
# Bash / Git Bash
openssl rand -base64 48
```

### 4.4 — Why `NPM_CONFIG_PRODUCTION=false` is required

`NODE_ENV=production` tells npm to skip `devDependencies`. But the build needs `@nestjs/cli` (for `nest build`) and `prisma` (for `prisma generate`), both of which are devDependencies. Setting `NPM_CONFIG_PRODUCTION=false` forces npm to install them anyway, while your app still sees `NODE_ENV=production` at runtime (so Swagger stays disabled and prod code paths run). Keep **both** variables set.

*(Alternative if you dislike the flag: move `prisma`, `@nestjs/cli`, and `ts-node` from `devDependencies` to `dependencies` in `apps/server/package.json`. The env-var route needs no code change and is what this manual assumes.)*

### 4.5 — Health check & deploy settings

In service **Settings**:
- **Health Check Path**: `/api/v1/health`
- **Health Check Timeout**: 300s (first boot + cold Neon can be slow)
- **Restart Policy**: On Failure, a few retries.
- **Start Command**: leave blank (uses root `start` script). If you prefer migrations to run automatically on every deploy, set the start command to:
  ```
  npm --prefix apps/server run prisma:deploy && npm --prefix apps/server run start:prod
  ```
  (Works because `NPM_CONFIG_PRODUCTION=false` kept the prisma CLI installed. Trade-off: adds a few seconds to each boot. Otherwise run migrations manually per §3.3.)

Trigger a deploy (push to GitHub, or `railway up`). Watch **Deploy Logs** until you see:
```
Kuapa AgriMarket API running on port <port>
```

### 4.6 — Verify the API is live

```powershell
# Replace with your domain
curl https://kuapa-production.up.railway.app/api/v1/health
```
Expect JSON like `{ "status": "ok", "database": { "connected": true }, "timestamp": ..., "uptime": ..., "memory": ... }`.

If `database.connected` is `false`: `DATABASE_URL` is wrong or Neon rejected SSL — re-check §3.2 and that migrations ran (§3.3).

### 4.7 — Seed the first admin (bootstraps admin-portal login)

The admin portal has no self-signup — you create the first super-admin with the seed script. It requires secrets passed as env vars and creates the account through better-auth (correctly hashed), then elevates it to `ADMIN` + `isSuperAdmin`.

Run it against the **production Neon DB** via the Railway environment so it uses the same `DATABASE_URL`:

```powershell
cd "C:\Users\Jerry\Desktop\PROJECT 2026\Kuapa\Kuapa"

# One-off, using Railway's env (DATABASE_URL etc. come from the service):
railway run --service kuapa-api `
  -- npm --prefix apps/server run seed:admin
```
…but `seed:admin` reads `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`ADMIN_NAME` from the environment. Provide them inline:

```powershell
# PowerShell: set for this invocation
$env:ADMIN_EMAIL="admin@kuapa.com"; $env:ADMIN_PASSWORD="<strong-password>"; $env:ADMIN_NAME="Super Admin"
railway run --service kuapa-api -- npm --prefix apps/server run seed:admin
```

Alternative (run entirely locally against Neon — simplest):
```powershell
cd "C:\Users\Jerry\Desktop\PROJECT 2026\Kuapa\Kuapa\apps\server"
$env:DATABASE_URL="<neon-direct-url>"
$env:ADMIN_EMAIL="admin@kuapa.com"; $env:ADMIN_PASSWORD="<strong-password>"; $env:ADMIN_NAME="Super Admin"
npm run seed:admin
```
Expected: `Successfully bootstrapped super-admin: admin@kuapa.com`.

Other seed scripts available if you want demo/reference data:
```
npm run seed:system     # system user
npm run seed:banners    # homepage banners
npm run seed:agri       # agri categories/reference data
```
(These also need `DATABASE_URL` set and use `ts-node`, so run with `NPM_CONFIG_PRODUCTION=false` deps present or locally with devDeps installed.)

---

## 5. PART C — Admin portal on Vercel

The admin is a standalone Next.js 16 app in `apps/admin`. It talks to the API purely over HTTP/WS using two public env vars.

### 5.1 — Import to Vercel

1. https://vercel.com → **Add New… → Project** → import your GitHub repo.
2. **Root Directory**: `apps/admin` (click *Edit* and select it — this is a monorepo).
3. Framework preset: **Next.js** (auto-detected). Build command `next build`, output auto. Install command `npm install` (its own lockfile is present).
4. **Environment Variables** (Production + Preview):
   ```
   NEXT_PUBLIC_API_URL=https://kuapa-production.up.railway.app/api/v1
   NEXT_PUBLIC_WS_URL=https://kuapa-production.up.railway.app
   ```
   These match `apps/admin/src/lib/api/client.ts` (`baseURL`) and `apps/admin/src/lib/socket.ts` (`WS_URL`). Note `NEXT_PUBLIC_API_URL` **includes** `/api/v1`; `NEXT_PUBLIC_WS_URL` is the bare origin (socket.io upgrades it).
5. Deploy. Vercel gives you a URL like `https://kuapa-admin.vercel.app`.

### 5.2 — Wire the admin URL back into the API

Whatever domain Vercel assigns (or your custom domain) **must** be in the server's `CORS_ORIGIN` and Better Auth `trustedOrigins`, or login will fail with CORS/session errors.

- If you used `kuapa-admin.vercel.app`, you're already covered — it's in the code's default `trustedOrigins` and in the `CORS_ORIGIN` you set in §4.2.
- If you use a **custom domain** (e.g. `admin.kuapa.com`), add it to:
  - Railway `CORS_ORIGIN` (comma-separated) — then redeploy the API.
  - `trustedOrigins` in `apps/server/src/auth/better-auth.ts` (add the string, commit, redeploy). `admin.kuapa.com` and `kuapa.com` are already listed.
- Set `WEB_URL` (Railway) to the admin origin so email-verification web links point at it.

### 5.3 — Log in

Open the Vercel URL → sign in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you seeded in §4.7. The account is pre-verified (`emailVerified: true`) and has `isSuperAdmin`, so you can manage the admin team from inside the portal.

> **Alternative host — Railway:** you can instead deploy the admin as a second Railway service (Root Directory `apps/admin`, Start `npm --prefix apps/admin run start`, and set `PORT` handling — Next `start` uses `-p 3001`, so set a custom start `next start -p $PORT`). Vercel is the lower-friction choice for Next.js and is what the code's defaults assume (`kuapa-admin.vercel.app`).

---

## 6. PART D — Mobile APK via Expo EAS

The mobile app is Expo SDK 54 with EAS Build. `eas.json` already defines `development`, `preview`, `device`, and `production` profiles — all set to output an **APK** for Android (`buildType: "apk"`). EAS project id `a830e794-6932-47fd-9779-9b1317c59f3f`, owner `amoahjerry835`.

### 6.1 — Prerequisite: apply the §1 fixes

Before building, make sure you've done §1.1 (backend URL in `eas.json`), §1.2 (deep-link scheme in `app.json`), and §1.3 (Google Maps native keys). The `eas.json` env blocks currently hardcode `bexiemart-production.up.railway.app` — **update every `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_SOCKET_URL`** there to your Railway domain, or the installed APK will call the wrong backend.

### 6.2 — Log in and confirm the project

```powershell
cd "C:\Users\Jerry\Desktop\PROJECT 2026\Kuapa\Kuapa\apps\mobile"
eas login                         # use the Expo account that owns the project (amoahjerry835)
eas whoami
eas build:configure               # confirms projectId/owner (already set in app.json)
```

### 6.3 — Environment variables for the build

EAS builds read `EXPO_PUBLIC_*` vars from the profile's `env` block in `eas.json` (these are **public** — they ship inside the app bundle; never put server secrets here). The one true secret is `SENTRY_AUTH_TOKEN`, used at build time to upload source maps — store it as an **EAS secret**, not in `eas.json`:

```powershell
eas secret:create --scope project --name SENTRY_AUTH_TOKEN --value "<your_sentry_auth_token>" --type string
```

Confirm/set the public vars per profile in `eas.json` (already present — just correct the URLs):
```
EXPO_PUBLIC_API_URL=https://kuapa-production.up.railway.app/api/v1
EXPO_PUBLIC_SOCKET_URL=wss://kuapa-production.up.railway.app
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxx      # pk_test_xxx while testing
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=duirkgqop
EXPO_PUBLIC_SENTRY_DSN=<mobile_sentry_dsn>
EXPO_PUBLIC_POSTHOG_API_KEY=phc_xxx
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

> **Feature flags:** the app gates the auth wall behind PostHog flag `mobile-auth`. Without valid PostHog keys the client disables and flags fall back to safe defaults (auth wall **enabled**). Set the PostHog vars if you rely on remote flags.

### 6.4 — Build the APK

Pick a profile:
- **`preview`** — internal-distribution APK, quickest way to get a shareable install for testers.
- **`production`** — auto-increments version, `channel: production`, still an APK (for a Play Store **AAB** you'd change `buildType`, but your setup ships APKs).

```powershell
# Shareable test APK:
eas build --platform android --profile preview

# Production APK:
eas build --platform android --profile production
```

EAS builds on their servers (no local Android SDK needed). When it finishes it prints a **build URL**; download the `.apk` from there, or:
```powershell
eas build:list --platform android --limit 5
```

Install the APK on an Android device (enable "Install unknown apps"). Since `usesCleartextTraffic` is true and the backend is HTTPS, it will reach Railway fine.

### 6.5 — First launch sanity checks

On the device, verify:
- App opens to the Kuapa splash (green `#0B5233`).
- Register/login hits the API (watch Railway logs: `railway logs --service kuapa-api`).
- Email verification: the link in the email should open the app via `kuapa://verify-email` (this only works after §1.2).
- Images upload (Cloudinary), payments open Paystack, map screens render (Google Maps native key).

### 6.6 — Over-the-air updates (optional, already configured)

`app.json` has `updates.url` and `runtimeVersion.policy: "appVersion"` pointing at EAS Update. After a build is installed, ship JS-only changes without a new APK:
```powershell
eas update --branch production --message "hotfix: ..."
```
This only works for JS/asset changes compatible with the installed native runtime (same `appVersion`). Native changes (new packages, permissions, `app.json` native config) require a new `eas build`.

### 6.7 — iOS (later)

`eas.json` has an iOS submit profile with placeholder Apple IDs (`appleId`, `ascAppId`, `appleTeamId` are dummy values). Fill those with real Apple Developer credentials before `eas build --platform ios` / `eas submit`. Not needed for the Android APK.

---

## 7. Master environment-variable reference

### 7.1 — Server (Railway) — `apps/server`

| Variable | Required | Purpose |
|---|:---:|---|
| `NODE_ENV` | ✅ | `production` — disables Swagger, enables prod code paths |
| `NPM_CONFIG_PRODUCTION` | ✅ (Railway) | `false` — keep build devDeps (prisma, nest CLI) |
| `PORT` | auto | Injected by Railway; code reads `process.env.PORT` |
| `DATABASE_URL` | ✅ | Neon Postgres connection string (SSL) |
| `BETTER_AUTH_SECRET` | ✅ | Session/token signing secret (64+ chars) |
| `BETTER_AUTH_URL` | ✅ | API root origin; auth mounts at `${this}/api/v1/auth` |
| `BETTER_AUTH_API_KEY` | ✅ | Better Auth Cloud key for `dash`+`sentinel` plugins |
| `BETTER_AUTH_API_URL` | ⬜ | Override Better Auth Cloud API endpoint |
| `BETTER_AUTH_KV_URL` | ⬜ | Override Better Auth Cloud KV endpoint |
| `CLIENT_URL` | ⬜ | Admin/web origin used for redirects |
| `WEB_URL` | ⬜ | Web base for email-verify links (default `kuapa-admin.vercel.app`) |
| `CORS_ORIGIN` | ✅ (prod) | Comma-separated allowed browser origins |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | ⬜ | Google social login |
| `PAYSTACK_SECRET_KEY` | ✅ (payments) | Paystack secret (`sk_live_`/`sk_test_`) |
| `CLOUDINARY_URL` | ✅ (images) | `cloudinary://key:secret@cloud` |
| `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`EMAIL_FROM` | ✅ (email) | Transactional email |
| `ARKESEL_API_KEY` / `ARKESEL_SENDER_ID` | ✅ (SMS) | OTP over SMS (Ghana) |
| `SENTRY_DSN` / `SENTRY_TRACES_SAMPLE_RATE` / `SENTRY_PROFILES_SAMPLE_RATE` | ⬜ | Server error monitoring |
| `GOOGLE_MAPS_API_KEY` | ⬜ | Routing/geocoding; falls back to Haversine if unset |
| `LOG_LEVEL` | ⬜ | `log` \| `debug` \| `verbose` |
| `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`ADMIN_NAME` | seed-only | Consumed by `seed:admin`, not needed at runtime |
| `DEV_EMAIL_HOST` | dev-only | Leave unset in prod |

### 7.2 — Admin (Vercel) — `apps/admin`

| Variable | Required | Purpose |
|---|:---:|---|
| `NEXT_PUBLIC_API_URL` | ✅ | API base **including** `/api/v1` |
| `NEXT_PUBLIC_WS_URL` | ✅ | socket.io origin (bare, no path) |

### 7.3 — Mobile (EAS / `eas.json` env + EAS secrets) — `apps/mobile`

| Variable | Required | Purpose |
|---|:---:|---|
| `EXPO_PUBLIC_API_URL` | ✅ | API base including `/api/v1` |
| `EXPO_PUBLIC_SOCKET_URL` | ✅ | `wss://<railway-domain>` |
| `EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY` | ✅ (payments) | Paystack **public** key |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` | ✅ (images) | Cloudinary cloud name |
| `EXPO_PUBLIC_SENTRY_DSN` | ⬜ | Mobile Sentry DSN |
| `EXPO_PUBLIC_POSTHOG_API_KEY` / `EXPO_PUBLIC_POSTHOG_HOST` | ⬜ | Analytics + remote feature flags |
| `SENTRY_AUTH_TOKEN` | build-time secret | Source-map upload — store as **EAS secret**, not in `eas.json` |

> Rule of thumb: `EXPO_PUBLIC_*` and `NEXT_PUBLIC_*` are **shipped to the client** — only ever public keys. Real secrets (DB URL, Paystack secret, SMTP pass, Better Auth secret/API key, Cloudinary secret) live **only** on Railway.

---

## 8. Deployment order (the happy path)

1. **Neon**: create project → copy direct `DATABASE_URL` (§3.1–3.2).
2. **Migrate**: locally run `prisma:deploy` against Neon (§3.3).
3. **Railway**: create service from GitHub → set all vars (incl. `NPM_CONFIG_PRODUCTION=false`) → generate domain → deploy → `curl /api/v1/health` (§4).
4. **Seed admin**: run `seed:admin` with `ADMIN_*` (§4.7).
5. **Fix URLs**: put the real Railway domain into `eas.json`, `apps/mobile/.env`, `apps/admin/.env.local`, Railway `BETTER_AUTH_URL`/`CORS_ORIGIN` (§1.1).
6. **Vercel**: import `apps/admin` → set `NEXT_PUBLIC_*` → deploy → log in with seeded admin (§5).
7. **CORS/trustedOrigins**: add any custom admin domain, redeploy API (§5.2).
8. **Mobile**: apply §1.2/§1.3 fixes → `eas secret` for Sentry token → `eas build --profile preview` → install APK → smoke-test (§6).
9. Flip test → live keys (Paystack), disable Neon autosuspend, add custom domains.

---

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Build fails: `nest: not found` / `prisma: not found` | `NODE_ENV=production` skipped devDeps | Set `NPM_CONFIG_PRODUCTION=false` (§4.4) |
| `/api/v1/health` → `database.connected: false` | Wrong `DATABASE_URL` or SSL | Use Neon **direct** URL with `?sslmode=require`; confirm migrations ran |
| Server boots then crashes on auth | `BETTER_AUTH_API_KEY` unset (code uses `apiKey!`) | Set it from Better Auth Cloud (§4.2) |
| Admin login: CORS / session error | Admin origin not trusted | Add origin to `CORS_ORIGIN` **and** `trustedOrigins`, redeploy |
| Admin loads but all API calls 404 | `NEXT_PUBLIC_API_URL` missing `/api/v1` | Include the full `/api/v1` suffix |
| APK can't reach backend | `eas.json` still on `bexiemart-production...` | Update all `EXPO_PUBLIC_API_URL`/`SOCKET_URL` (§1.1) and rebuild |
| Email "verify" link doesn't open app | Deep-link scheme mismatch | Change intent filters to `kuapa://` (§1.2), rebuild |
| Maps screen crashes on device | Placeholder native Maps keys | Add real Maps SDK keys to `app.json` (§1.3) |
| First request after idle is slow | Neon autosuspend (free tier) | Expected; upgrade Neon plan or keep a warming ping |
| Payments fail in production | Still on Paystack test keys | Swap to `sk_live_`/`pk_live_` on Railway and in `eas.json` |
| WebSocket won't connect from APK | `EXPO_PUBLIC_SOCKET_URL` uses `ws://` | Use `wss://` over HTTPS |

### Useful commands

```powershell
railway logs --service kuapa-api                 # tail server logs
railway variables --service kuapa-api            # list current vars
railway redeploy --service kuapa-api             # force redeploy
railway run --service kuapa-api -- <cmd>         # run a command with prod env
eas build:list --platform android                # recent APK builds
eas update --branch production -m "..."          # OTA JS update
```

---

## 10. Production hardening checklist (post-launch)

- [ ] Rotate `BETTER_AUTH_SECRET`, SMTP password, and any keys that were ever in a committed file.
- [ ] Switch Paystack, and any other sandbox integrations, to **live** keys.
- [ ] Restrict `GOOGLE_MAPS_API_KEY` (server) by API + IP, and the native keys by app package/bundle + SHA-1.
- [ ] Disable Neon autosuspend (or accept cold starts) and enable Neon PITR/backups.
- [ ] Add custom domains: `api.kuapa.com` (Railway), `admin.kuapa.com` (Vercel) → update `BETTER_AUTH_URL`, `CORS_ORIGIN`, `trustedOrigins`, admin/mobile env, and `app.json` App Links host.
- [ ] Set Sentry sample rates appropriately and confirm both server + mobile DSNs report.
- [ ] Confirm Railway health checks + restart policy; consider a second replica only after moving `DATABASE_URL` to Neon's **pooled** endpoint.
- [ ] Take a Neon **branch** for staging and a matching Railway environment before testing risky migrations.
- [ ] Finalize store identity (`bundleIdentifier`/`package`) before publishing — changing it later means a new app listing.
```
