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

## 3. Create OAuth credentials (Web application)

We use a Web application client + Google's OAuth Playground to capture the refresh token, because Google deprecated the old `urn:ietf:wg:oauth:2.0:oob` "out-of-band" flow that Desktop app clients relied on, and new projects get rejected with `Error 403: access_denied` if they try to use it.

1. Left sidebar → **Clients** → **+ Create client**.
2. Application type: **Web application**. Name: `matthewmalan-tasks-playground`.
3. Under **Authorized redirect URIs**, add: `https://developers.google.com/oauthplayground`
4. Create. Copy the **Client ID** and **Client Secret** — these become `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

## 4. Get a refresh token (one-time)

1. Open https://developers.google.com/oauthplayground/
2. Click the ⚙️ gear icon (top-right).
3. Check **Use your own OAuth credentials**.
4. Paste the Client ID and Client Secret from step 3 → close the settings.
5. In the left scope list, scroll down to **Tasks API v1** → check `https://www.googleapis.com/auth/tasks.readonly`.
6. Click **Authorize APIs**.
7. Sign in as the account whose tasks you want to read. You'll see "Google hasn't verified this app" — click **Advanced → Go to matthewmalan.com (unsafe) → Continue**. (Normal for unverified apps with sensitive scopes; you're authorizing your own app to access your own data.)
8. Back in the Playground, you're now on Step 2. Click **Exchange authorization code for tokens**.
9. The response on the right shows `"refresh_token": "1//..."`. Copy that value — that's `GOOGLE_TASKS_REFRESH_TOKEN`.

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

- **`Access blocked: ... has not completed the Google verification process` / `Error 403: access_denied`** — most common cause is using the deprecated `urn:ietf:wg:oauth:2.0:oob` redirect URI with a Desktop app client. Use the OAuth Playground flow in steps 3–4 instead. Second most common: the app is in Testing mode and your email isn't on the Test users list (Audience → Test users) — publish the app (step 2.3) so this stops mattering.
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
