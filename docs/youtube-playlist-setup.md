# YouTube playlist (Speaking page) setup

The `/speaking/` page pulls every video in the "Speeches" playlist on every build via the YouTube Data API v3 and renders them as cards.

If the secret below is missing, the section just hides itself — the build still succeeds.

## 1. Enable the API

Reuse the same Google Cloud project you created for Google Tasks (`matthewmalan-tasks` — project number `281930056851`).

1. Open https://console.cloud.google.com/apis/library/youtube.googleapis.com?project=281930056851
2. Click **Enable**

## 2. Create an API key

1. **APIs & Services → Credentials → + Create credentials → API key**
2. Copy the key (looks like `AIzaSy...`).
3. (Recommended) Click the new key, then under **API restrictions**, pick **Restrict key → YouTube Data API v3**. This way if it ever leaks, an attacker can only hit YouTube on your behalf — not Tasks or anything else.
4. Save.

Note: unlike the OAuth flow for Tasks, this is a **plain API key**. It only reads public playlist data, so no user consent / refresh token / playground dance is needed.

## 3. Add the secret to GitHub

In the repo → **Settings → Secrets and variables → Actions → New repository secret**:

- Name: `YOUTUBE_API_KEY`
- Value: the `AIzaSy...` key from step 2

## 4. Trigger a rebuild

Push any commit or run the workflow manually. The build log should show:

```
[youtube] Wrote N videos → .../speeches.json
```

After deploy, the Speeches section will appear on `/speaking/` between the topic cards and the CTA, with one card per playlist video. Newest first.

## Changing which playlist powers the section

Edit `PLAYLIST_ID` at the top of `scripts/fetch-youtube-playlist.mjs`.

## Troubleshooting

- **`[youtube] Fetch failed: 403`** — API key is restricted to the wrong API, or the YouTube Data API isn't enabled on the project. Re-check step 1.
- **`[youtube] Fetch failed: 400 keyInvalid`** — typo in the secret. Regenerate or re-paste.
- **No videos appear but the build log says `Wrote 0 videos`** — the playlist is empty or all videos are private/unlisted. Make sure videos are at least **Unlisted** (public works too). Private videos are skipped intentionally.
- **Quota**: the YouTube API gives 10,000 quota units/day. Each `playlistItems.list` call costs 1 unit. You'd need 10,000 builds per day to hit the limit. Don't worry about it.

## Local testing

```bash
export YOUTUBE_API_KEY=AIzaSy...
node scripts/fetch-youtube-playlist.mjs
```

Then `pnpm dev` and open http://localhost:3400/speaking/ — scroll to "Watch me speak."
