# Deploying to Vercel

The whole app ships as **one Vercel project on one domain**:

| Part | How it runs |
| --- | --- |
| `client/` (Vite + React) | Built to static files, served from the CDN |
| `server/` (Express + Mongoose) | Bundled into a single serverless function at `/api/*` |
| MongoDB | External — MongoDB Atlas (Vercel has no database) |

Because the site and the API share a domain, the browser calls `/api/...`
same-origin: no CORS setup and no cookie-domain problems.

## Files that make this work

- `vercel.json` — build command, output directory, and the two rewrites
  (`/api/*` → the function, everything else → `index.html` for React Router).
- `api/index.ts` — the serverless entry. It connects to MongoDB, then hands the
  request to the existing Express app.
- `server/src/config/db.ts` — caches the Mongoose connection on `globalThis` so
  warm invocations reuse the pool instead of dialing Atlas on every request.
- `server/src/app.ts` — `trust proxy` is enabled so rate limiting sees the real
  client IP through Vercel's proxy.

`server/src/index.ts` (the `app.listen` server) is untouched and is still what
`npm run dev` uses locally.

## One-time setup

### 1. MongoDB Atlas

1. Create a free cluster and a database user.
2. Network Access → allow `0.0.0.0/0`. Vercel functions have no fixed IPs, so an
   IP allowlist cannot work; the connection is protected by the credentials.
3. Copy the SRV connection string (`mongodb+srv://user:pass@.../starlearners`).

### 2. Import the project

On [vercel.com](https://vercel.com) → **Add New → Project** → import
`HridayJain01/SLL_Dev`. Leave the Root Directory as the repository root —
`vercel.json` already points the build at the `client` workspace. Do not set a
framework override; the settings in `vercel.json` win.

### 3. Environment variables

Add these under **Settings → Environment Variables** (Production *and* Preview),
then redeploy. `NODE_ENV=production` is set by Vercel automatically.

**Required**

| Variable | Notes |
| --- | --- |
| `MONGODB_URI` | Atlas SRV string |
| `JWT_SECRET` | long random string — generate with `openssl rand -base64 48` |
| `CLIENT_URL` | your deployed URL, e.g. `https://sll.vercel.app` (used in email links). May hold several comma-separated origins for CORS; email links use the first. |
| `CRON_SECRET` | long random string — guards the daily reminder job. Without it, reminders do not run. |

**Cloudinary — needed for book-cover uploads**

`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

**Email — optional; without it, mail is logged instead of sent**

`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`,
`EMAIL_FROM`, `EMAIL_FROM_NAME`, `SUPPORT_EMAIL`

Every active admin account also gets a new-order email with a printable packing
slip PDF attached.

**WhatsApp — optional; without it, messages are logged instead of sent**

`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TEMPLATE_LANG` (default `en`).
Uses the Meta WhatsApp Cloud API. Two templates must be approved in WhatsApp
Manager first, named `order_placed` and `return_reminder` — their exact wording
and variables are in `server/src/lib/whatsapp.ts`.

**Error tracking — optional; off until set**

| Variable | Notes |
| --- | --- |
| `SENTRY_DSN` | Server. Reports every 5xx (never 4xx). Unset = the SDK is never loaded. |
| `VITE_SENTRY_DSN` | Browser. Reports uncaught errors, unhandled rejections, and crashes caught by the React error boundary. Unset = not even bundled. Can be the same DSN as the server. |

Create the project at sentry.io (platform: React for the browser, Node/Express
for the server — one project is fine for both).

**Client-side (baked into the bundle at build time)**

| Variable | Notes |
| --- | --- |
| `VITE_WHATSAPP_NUMBER` | e.g. `919812345678`. **Required in practice** — every "buy this plan" button is a WhatsApp link to it. Unset, the build warns and the links point at a placeholder. |
| `VITE_API_URL` | **leave unset.** Unset means the client calls `/api` on its own origin, which is what you want |

Changing a `VITE_*` variable requires a new deploy to take effect — it is
compiled into the JS bundle, not read at runtime.

### 4. Deploy and verify

```
https://<your-app>.vercel.app/api/health   → {"status":"ok","env":"production"}
```

Then load the site, register a user, and log in. If `/api/health` works but data
routes return 503, the `MONGODB_URI` or the Atlas network rule is wrong — check
the function logs under **Deployments → … → Functions**.

### 5. Seed the catalogue

Seeding runs from your machine against Atlas, not on Vercel:

```bash
cd server
MONGODB_URI="<atlas-uri>" npm run seed
```

## Things worth knowing

- **Rate limiting is per-instance.** `express-rate-limit` keeps counters in
  memory, and Vercel may run several instances, so the 20-attempts/15-min auth
  limit is enforced per instance rather than globally. Fine as a speed bump; if
  you need a hard limit, move the store to Redis (Upstash).
- **Cold starts.** The first request after idle pays the Mongo handshake
  (roughly 1–2s). Subsequent requests reuse the cached connection.
- **Uploads** already use `multer.memoryStorage()` and stream to Cloudinary, so
  nothing depends on a writable disk — good, because the function filesystem is
  read-only apart from `/tmp`.
- **Background jobs run as Vercel Cron.** The reminder job runs daily at 03:00
  UTC (~08:30 IST) and reminds only loans due in exactly 3 or 1 days (email +
  WhatsApp), never on other days or once overdue. It runs via the `crons` entry in `vercel.json`, which calls
  `GET /api/notifications/cron/reminders`. That route is authenticated by
  `CRON_SECRET` rather than a session — cron requests carry no cookie — and Vercel
  sends the value as a Bearer token once the variable is set. **Without
  `CRON_SECRET` configured the route returns 503 and no reminders go out**; it fails
  closed on purpose. Reminders are deduplicated per loan per day, so a retried or
  double-fired schedule is harmless. Admins can still trigger a run by hand from the
  notifications screen — both paths call the same function.
- **Function limits:** 1024 MB memory, 30s max duration, configured in
  `vercel.json`.

## Alternative: API on a always-on host

If you later want persistent connections, background jobs, or websockets, deploy
`server/` to Render/Railway/Fly instead and keep only the client on Vercel. In
that case set `VITE_API_URL=https://api.yourdomain.com/api` on Vercel and
`CLIENT_URL=https://yourdomain.com` on the API host, and switch the JWT cookie to
`sameSite: 'none'` in `server/src/lib/jwt.ts` if the two live on different
domains.
