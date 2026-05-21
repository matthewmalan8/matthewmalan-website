# Beeminder integration

Every goal in `/goals-admin/` has an optional **Beeminder slug** field.
When you set it, the site syncs that goal's current value to the matching
Beeminder goal — once when the site deploys, and again at 6 AM UTC daily
via the **Sync Beeminder** workflow.

Beeminder enforces the failure (and the money on the line) — the website
just feeds it accurate numbers. Beeminder beats the website on
correctness because *Beeminder* is the thing with money attached.

## One-time setup

### 1. Get your auth token

1. Sign in to https://www.beeminder.com
2. Open **Settings → Account → Account Permissions**
3. Copy your **auth_token** (the long base64 string)

### 2. Add the secrets to GitHub

https://github.com/matthewmalan8/matthewmalan-website/settings/secrets/actions

| Type | Name | Value |
|------|------|-------|
| Secret | `BEEMINDER_USERNAME` | your Beeminder username |
| Secret | `BEEMINDER_AUTH_TOKEN` | the auth_token from step 1 |

Optional — for testing without writing real datapoints, add an Actions
**variable** (not secret) named `BEEMINDER_DRY_RUN` with value `1`. The
script logs what it *would* push but doesn't send anything. Delete the
variable when you're ready to go live.

## Per-goal setup

### Pick the right deadline

Because the website syncs at 6 AM UTC daily, set the **Beeminder goal's
deadline to one day AFTER your website goal's deadline**. Otherwise
Beeminder might enforce failure for a goal the website was about to
mark complete a few hours later.

Example: website goal says "20 hours of dropshipping by Saturday 5/23."
Set the Beeminder goal to deadline **Sunday 5/24** so the sync has
time to push Saturday's final hours before Beeminder evaluates.

### Wire a goal to Beeminder

1. Open https://www.beeminder.com and create the goal there first.
   Pick the right goal type (Do More, Odometer, etc.) and set the
   deadline as described above. Copy the slug (the URL piece after
   `/yourname/`).
2. Open https://matthewmalan.com/goals-admin/ → edit the matching
   website goal → paste the slug into the **Beeminder slug** field.
3. Save. On the next site build (or the next 6 AM UTC tick), the
   value flows to Beeminder.

## How the sync works

Each datapoint sent looks like:

| Field | Value |
|------|------|
| `daystamp` | today (YYYYMMDD) |
| `value` | the goal's current value (from the manual `current` field OR the auto-computed metric sum) |
| `comment` | `matthewmalan.com sync · {goal title} ({slug})` |
| `requestid` | `mm-{goal slug}-{daystamp}` |

The `requestid` is the same each day for the same goal, so re-running
the script **upserts** today's datapoint rather than stacking duplicates.

## What gets synced

Every goal with `beeminderSlug` set AND `status: active` gets a
datapoint. Successful / failed / archived goals are skipped.

## Manual trigger

Open https://github.com/matthewmalan8/matthewmalan-website/actions →
**Sync Beeminder** → **Run workflow** to fire on demand.

## Troubleshooting

- **`Beeminder 401: Unauthorized`** — token wrong, regenerate it in
  Settings → Account.
- **`Beeminder 404`** — slug typo'd. Beeminder slugs are lowercase
  with dashes, e.g. `dropship-hours-q2`, not `Dropship Hours Q2`.
- **Beeminder shows wrong value** — re-check the website goal:
  - If `metricSlug` is set, the value is the sum of metric entries
    within the goal's date range.
  - If `metricSlug` is empty, the value is whatever's in the manual
    `current` field.
  - The auto-sources (dropshipping daily logs, Hevy workouts, podcast
    episodes) might be out of date; check the most recent build log.
