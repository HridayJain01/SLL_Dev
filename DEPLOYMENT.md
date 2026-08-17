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
| `CLIENT_URL` | your deployed URL, e.g. `https://sll.vercel.app` (used in email links) |

**Cloudinary — needed for book-cover uploads**

`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

**Email — optional; without it, mail is logged instead of sent**

`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`,
`EMAIL_FROM`, `EMAIL_FROM_NAME`, `SUPPORT_EMAIL`

**Client-side (baked into the bundle at build time)**

| Variable | Notes |
| --- | --- |
| `VITE_WHATSAPP_NUMBER` | e.g. `919812345678` — otherwise the placeholder number is used |
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
- **No background jobs.** Anything recurring (overdue-book reminders, for
  example) needs a Vercel Cron Job hitting an endpoint; serverless functions only
  run while handling a request.
- **Function limits:** 1024 MB memory, 30s max duration, configured in
  `vercel.json`.

## Alternative: API on a always-on host

If you later want persistent connections, background jobs, or websockets, deploy
`server/` to Render/Railway/Fly instead and keep only the client on Vercel. In
that case set `VITE_API_URL=https://api.yourdomain.com/api` on Vercel and
`CLIENT_URL=https://yourdomain.com` on the API host, and switch the JWT cookie to
`sameSite: 'none'` in `server/src/lib/jwt.ts` if the two live on different
domains.
