# Google Tasks integration setup

One-time setup so the dropshipping calendar pulls in your real task lists.

The site rebuilds daily at 7 AM UTC (and on every push). Each build runs `scripts/fetch-google-tasks.mjs`, which uses your OAuth refresh token to call the Google Tasks API and cache everything to `content/dropshipping/cache/tasks.json`. The calendar reads that cache and groups tasks by completion / due date.

If the secrets below are missing the build still succeeds — the calendar just shows the "not connected yet" hint.

## 1. Create a Google Cloud project

1. Go to https://console.cloud.google.com/projectcreate and create a project (name it anything — e.g. `matthewmalan-tasks`).
2. With that project selected, open **APIs & Services → Library**, search for **Tasks API**, and click **Enable**.

## 2. Create an OAuth client

1. **APIs & Services → OAuth consent screen**. Pick **External**, fill in the app name (`matthewmalan.com`), your email, save. Add yourself as a Test User on the next screen so unverified consent works.
2. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
3. Application type: **Desktop app**. Name: `matthewmalan-tasks-local`. Create.
4. Copy the **Client ID** and **Client Secret** from the modal. These become `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` later.

## 3. Get a refresh token (one-time)

This is the only step that needs a browser. You're using your own desktop machine.

```bash
# Replace <CLIENT_ID> below.
# 1. Open this URL in a browser, approve access, copy the "code" param from the redirect.
echo "https://accounts.google.com/o/oauth2/v2/auth?client_id=<CLIENT_ID>&redirect_uri=urn:ietf:wg:oauth:2.0:oob&response_type=code&scope=https://www.googleapis.com/auth/tasks.readonly&access_type=offline&prompt=consent"
```

> Note: `urn:ietf:wg:oauth:2.0:oob` (the "out of band" flow) is deprecated for new projects. If Google rejects it, instead create the OAuth client as a **Web application** with redirect URI `http://localhost:8080`, then run a one-off local listener (e.g. `npx oauth2-local-listener`) to capture the code.

Then exchange the code for a refresh token:

```bash
curl -X POST https://oauth2.googleapis.com/token \
  -d "code=<CODE>" \
  -d "client_id=<CLIENT_ID>" \
  -d "client_secret=<CLIENT_SECRET>" \
  -d "redirect_uri=urn:ietf:wg:oauth:2.0:oob" \
  -d "grant_type=authorization_code"
```

The `refresh_token` field in the response is what we want. Save it.

## 4. Add the secrets to GitHub

In the repo → **Settings → Secrets and variables → Actions → New repository secret**, add:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_TASKS_REFRESH_TOKEN`

## 5. Trigger a rebuild

Either push any commit, or open **Actions → Deploy to AWS → Run workflow**. The build log will show:

```
[tasks] Wrote N tasks across M days (K lists) → .../tasks.json
```

After deploy, click any calendar date on `/dropshipping/` — the panel will show that day's tasks grouped by Google Tasks list, with completed ones checked off.

## Troubleshooting

- **`Token refresh failed: 400 invalid_grant`** — the refresh token was revoked (likely because the OAuth consent screen is in Testing mode and tokens expire after 7 days). Either publish the consent screen, or regenerate the refresh token from step 3.
- **`Missing GOOGLE_*` in build log** — one of the secrets isn't set. The build still succeeds with an empty cache; add the secret and rerun.
- **Empty cache despite credentials present** — check that you granted the `tasks.readonly` scope during the OAuth dance. The `prompt=consent` query param in the auth URL forces re-prompting.

## Local testing

```bash
export GOOGLE_CLIENT_ID=...
export GOOGLE_CLIENT_SECRET=...
export GOOGLE_TASKS_REFRESH_TOKEN=...
node scripts/fetch-google-tasks.mjs
```

Then `pnpm dev` and open `/dropshipping/`. Click any day with a green dot.
