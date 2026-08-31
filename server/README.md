# LeanMorph server

A tiny backend for your health app. No npm install needed — it only uses
Node's built-in modules. It does two jobs at once:

1. **Serves the app itself** (`public/index.html`, your uploaded file).
2. **Saves your data** to a JSON file (`data/store.json`) so it persists
   across browser sessions and devices, instead of only living in the
   browser tab.

This is the exact server your app was already coded to talk to — it calls
`/api/state` on load and on every change (that's why the code you gave me
already had `API_BASE`, `loadStateFromServer()`, etc. built in).

## Run it on your PC (local server)

Requirements: [Node.js](https://nodejs.org) 18 or newer.

```bash
node server.js
```

Then open **http://127.0.0.1:3847** in your browser. That's it — the app
and API are both served from that one address, so nothing extra to
configure. Your data is saved in `data/store.json` next to the server —
back that file up if you want to keep your history safe.

To stop the server, press `Ctrl+C` in the terminal.

If you'd rather still open `public/index.html` directly as a file
(double-click it), that also works — the app auto-detects `file://` pages
and talks to `http://127.0.0.1:3847/api`, as long as the server above is
running in the background.

## Put it on a real website

Because the server serves the app *and* the API from the same address,
deployment is just "run this one program somewhere with internet
exposure." A few common options:

**A cheap VPS (DigitalOcean, Linode, a home server, etc.)**
```bash
# on the server
node server.js            # or better: use pm2 to keep it running
```
Then point your domain's DNS at that machine and put it behind a reverse
proxy (e.g. Nginx or Caddy) for HTTPS. Set `PORT=80` (or whatever your
proxy forwards to) via an environment variable if needed:
```bash
PORT=8080 node server.js
```

**A platform-as-a-service (Render, Railway, Fly.io, etc.)**
- Push this folder to a Git repo.
- Create a new "Web Service" pointing at it.
- Start command: `node server.js`
- No build step and no dependencies to install — it just runs.
- The platform sets `PORT` for you automatically; the server already
  reads `process.env.PORT`.

Either way, once it's live at your domain, the app will automatically call
`https://yourdomain.com/api/...` (same-origin), so there's no CORS
configuration to worry about.

## API it exposes

- `GET /api/health` → `{ ok: true }`
- `GET /api/state?date=YYYY-MM-DD` → today's log (water, meals, workouts,
  sleep, steps) plus your profile, targets, goals, reminders, weight log,
  and history.
- `PUT /api/state` → saves everything in one call; body is the full state
  object the app already sends.

## Notes

- Storage is a single JSON file (`data/store.json`), which is plenty for
  one person's daily health data. If you outgrow it (multiple users,
  thousands of entries) it's a straightforward swap to SQLite or Postgres
  later — the API shape wouldn't need to change.
- There's currently no login/auth — anyone who can reach the server can
  read and write the data. Fine for personal/local use; if you deploy it
  publicly and want it private, put it behind a login on the reverse proxy
  or ask me to add simple auth.
