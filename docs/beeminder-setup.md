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

## Per-goal setup — Beeminder goals auto-create

You don't have to create the Beeminder goal yourself. Just type any
slug you want into the **Beeminder slug** field in `/goals-admin/`
(lowercase + dashes — e.g. `dropship-hours-w21`, `gym-q2`). On the
next sync (every deploy + 6 AM UTC daily), the script does this:

1. **Checks** if a goal with that slug already exists on Beeminder.
2. **If missing** → creates it using the website goal's data:
   - **title** = website goal's title
   - **goal_type** = `hustler` (Do More by date) — works for every
     metric we have. Change on Beeminder's UI later if you want a
     different road shape.
   - **goalval** = website goal's `target`
   - **goaldate** = website goal's `deadline` **+ 1 day**, anchored at
     noon MST so the timestamp lands squarely on the correct calendar
     day.
   - **deadline** = `-60` (Beeminder's per-goal field that controls
     the precise time of day for evaluation). -60 = 60 seconds before
     midnight = **23:59:00 of the goaldate's local day**.
   - **timezone** = `America/Phoenix` (MST, no DST) pinned per-goal so
     the day boundary can't drift even if your Beeminder account
     timezone is something else.
   - **gunits** = website goal's `unit`
   - **initval** = the goal's current value at create time
   - **secret** = `true` (private by default; you can flip it to
     public on Beeminder's UI)

   **Net effect**: if the website goal's deadline is `2026-05-22`,
   Beeminder charges at exactly **`2026-05-23 23:59 MST`**.
3. **Pushes a datapoint** for today with the current value.

You can also create the goal manually on Beeminder first if you want
custom settings (different road shape, public visibility, etc.) — the
sync will see it already exists and just keep pushing datapoints.

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
