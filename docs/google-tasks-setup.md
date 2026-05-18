# Google Tasks integration setup

One-time setup so the dropshipping calendar pulls in your real task lists.

The site rebuilds daily at 7 AM UTC (and on every push). Each build runs `scripts/fetch-google-tasks.mjs`, which uses your OAuth refresh token to call the Google Tasks API and cache everything to `content/dropshipping/cache/tasks.json`. The calendar reads that cache and groups tasks by completion / due date.

If the secrets below are missing the build still succeeds — the calendar just shows the "not connected yet" hint.

## 1. Create a Google Cloud project

1. Go to https://console.cloud.google.com/projectcreate and create a project (name it anything — e.g. `matthewmalan-tasks`).
2. With that project selected, open **APIs & Services → Library**, search for **Tasks API**, and click **Enable**.

## 2. Configure the OAuth consent screen

1. **APIs & Services → OAuth consent screen**. Pick **External**, fill in the app name (`matthewmalan.com`), your email, save through to the end.
2. **Test users → + Add users → `mattmalan6@gmail.com` → Save.** Without this you'll hit `Error 403: access_denied` when trying to authorize.
3. **Publish the app.** Back on the OAuth consent screen, click **Publish app → Confirm**. You're only asking for the `tasks.readonly` scope on your own account, so Google won't actually require formal verification — but publishing matters because **refresh tokens issued in Testing mode expire after 7 days**, while published-app tokens don't expire. If you skip this, you'll be regenerating tokens weekly.

## 3. Create OAuth credentials

1. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
2. Application type: **Desktop app**. Name: `matthewmalan-tasks-local`. Create.
3. Copy the **Client ID** and **Client Secret** from the modal. These become `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` later.

## 4. Get a refresh token (one-time)

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

## 5. Add the secrets to GitHub

In the repo → **Settings → Secrets and variables → Actions → New repository secret**, add:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_TASKS_REFRESH_TOKEN`

## 6. Trigger a rebuild

Either push any commit, or open **Actions → Deploy to AWS → Run workflow**. The build log will show:

```
[tasks] Wrote N tasks across M days (K lists) → .../tasks.json
```

After deploy, click any calendar date on `/dropshipping/` — the panel will show that day's tasks grouped by Google Tasks list, with completed ones checked off.

## Troubleshooting

- **`Access blocked: ... has not completed the Google verification process` / `Error 403: access_denied`** — your email isn't on the Test users list, OR the app isn't published. Go to step 2 and either add yourself as a test user (token expires in 7 days) or publish the app (token never expires).
- **`Token refresh failed: 400 invalid_grant`** — the refresh token was revoked. Most common cause: the consent screen was in Testing mode and 7 days have passed. Publish the app (step 2.3) and regenerate the token (step 4).
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

The numbered sections above are now: (1) Google Cloud project + Tasks API, (2) OAuth consent screen + Test user + Publish, (3) OAuth credentials, (4) Refresh token, (5) GitHub secrets, (6) Trigger rebuild.
