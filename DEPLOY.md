# 🚀 Deploying BudgetBuddy

The app is two pieces: an Express API (`backend/`) and a React frontend
(`frontend/`) that ships either as a website or as the Android app. Only the
API needs hosting — the Android app is built once and installed on a phone.

Until the API is deployed, the app only works while your laptop is running it.

---

## 1. Rotate your credentials first

The Neon database password and Clerk secret key were committed to this
repository's history. Before this handles anyone's data on a public URL,
generate new ones:

- **Neon** — console → your project → Roles → reset password
- **Clerk** — dashboard → API Keys → regenerate the secret key

Update `backend/.env` locally with the new values, and use the new ones when
filling in the host's environment settings below.

---

## 2. Deploy the API

The repo includes `render.yaml`, so on Render you can pick **New → Blueprint**,
point it at this repo, and it will read the service definition. Any host that
runs a Node process works the same way — these are the settings that matter:

| Setting | Value |
|---|---|
| Root directory | `backend` |
| Build command | `npm ci` |
| Start command | `npm start` |
| Health check path | `/api/health` |

### Environment variables

| Variable | Required | What it's for |
|---|---|---|
| `DATABASE_URL` | **Yes** | Neon connection string. The server refuses to start without it. |
| `CLERK_SECRET_KEY` | **Yes** | Verifies auth tokens. Also refuses to start without it. |
| `NODE_ENV` | Yes | `production` |
| `FRONTEND_URL` | Yes | Your web frontend's origin, for CORS. The Android app's own origin is already allowed. |
| `GMAIL_IMAP_USER` | For bank sync | The mailbox **dedicated to the app** — never a personal one, since every user's forwarded mail lands there. |
| `GMAIL_IMAP_APP_PASSWORD` | For bank sync | Gmail App Password for that account. |
| `BANK_ALERT_SENDER` | No | Defaults to `alerts@axis.bank.in`. |
| `SYNC_CRON_SECRET` | For scheduled sync | Shared secret for the scheduler. Generate a long random string. |
| `EMAIL_SYNC_INTERVAL_MINUTES` | No | Set to `0` on free hosting — see step 4. |

The server logs a warning at boot for each optional variable that's missing,
naming the feature it disables, so check the deploy logs after the first boot.

---

## 3. Create the database tables

Migrations don't run automatically — applying schema changes to a live database
should be a decision, not a side effect of a deploy. Run them yourself,
pointed at the deployed database:

```bash
cd backend
DATABASE_URL="<your production connection string>" npm run db:migrate
DATABASE_URL="<your production connection string>" npm run db:status
```

`db:status` is the check that matters: it reports any table or column the
database is missing. See `backend/migrations/README.md` for the details.

---

## 4. Set up the scheduled sync

**This is the step that's easy to skip and quietly breaks bank sync.**

Free hosting suspends an instance once it's idle. A suspended process runs no
timers, so the in-process poller stops — silently. The schedule has to come
from outside, which is what `POST /api/sync/cron` is for: a scheduled request
both wakes the instance and runs the sync.

Set `EMAIL_SYNC_INTERVAL_MINUTES=0` so the app doesn't also poll internally,
then point a scheduler at:

```
POST https://your-api.onrender.com/api/sync/cron
Authorization: Bearer <SYNC_CRON_SECRET>
```

Every 15 minutes is a sensible starting point. Any of these work:

- **[cron-job.org](https://cron-job.org)** — free, supports custom headers
- **Render Cron Job** — a second service on the same account
- **GitHub Actions** — a `schedule:` workflow running one `curl`

The secret can also be passed as `?secret=…` if your scheduler can't set
headers, though a header keeps it out of request logs. Without a correct
secret the endpoint returns 401; if `SYNC_CRON_SECRET` isn't configured at all
it returns 503 rather than running unauthenticated.

Verify it works:

```bash
curl -X POST https://your-api.onrender.com/api/sync/cron \
  -H "Authorization: Bearer <SYNC_CRON_SECRET>"
# {"success":true,"data":{"synced":0,"skipped":false}}
```

---

## 5. Point the app at the deployed API

In `frontend/.env.local`:

```env
VITE_API_URL=https://your-api.onrender.com/api
```

Then rebuild — the API URL is baked in at build time, so this must happen
before you build the APK:

```bash
cd frontend
npm run cap:sync
```

Full APK instructions, including signing, are in [MOBILE.md](MOBILE.md).

---

## Things worth knowing

**First open after idle is slow.** A free instance takes a while to wake. The
app shows a "server may be waking up" message rather than looking broken, but
if you want it to feel instant, that's what paid tiers are for.

**Health checks.** `/api/health` is cheap and doesn't touch the database — use
it for frequent polling. `/api/health/ready` verifies the database is
reachable; use it as a deploy gate, not a heartbeat.

**Cleartext HTTP.** The Android app currently permits it so it can reach a LAN
dev server. Once you're on an HTTPS URL, set `cleartextTrafficPermitted` to
`false` in `frontend/android/app/src/main/res/xml/network_security_config.xml`.
