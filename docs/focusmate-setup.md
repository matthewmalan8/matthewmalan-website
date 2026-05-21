# FocusMate ↔ Beeminder ↔ Website

FocusMate's only "send my data somewhere" hook is its **built-in
Beeminder integration**. There's no public FocusMate API for individual
users, so we use Beeminder as the relay: FocusMate posts to Beeminder,
and the website mirrors the Beeminder data back as a metric.

```
┌──────────────┐  +1 per session   ┌───────────┐  daily pull   ┌────────────┐
│  FocusMate   │ ────────────────▶ │ Beeminder │ ────────────▶ │  Website   │
│  (sessions)  │                   │   (goal)  │  (datapoints) │  (metric)  │
└──────────────┘                   └───────────┘               └────────────┘
```

## One-time setup

### 1. Connect FocusMate to Beeminder

1. Open https://app.focusmate.com/settings/integrations
2. Find **Beeminder** in the integrations list and click **Connect**.
3. FocusMate will ask which Beeminder goal should receive sessions.
   - Pick an existing goal, or click to create a new one called
     `focusmate` (or whatever slug you want).
4. FocusMate will now POST a +1 datapoint to that Beeminder goal every
   time you complete a session. You don't have to do anything else on
   FocusMate's side.

### 2. Make sure the website knows which Beeminder goal it is

Open https://matthewmalan.com/goals-admin/ → **Metrics** → edit the
**FocusMate sessions** entry. The `beeminderSource` field is preset to
`focusmate`. If you used a different Beeminder slug in step 1, change
it here to match.

### 3. Create website goals that count FocusMate sessions

Open `/goals-admin/` → pick any category (Fundamentals is a natural
fit) → **+ New goal**. In the **Linked metric** field, choose
**FocusMate sessions**. The goal's progress will now be summed from
the FocusMate-via-Beeminder datapoints.

Example: "Do 5 FocusMate sessions this week" — `target: 5`,
`timeframe: week`, `metricSlug: focusmate-sessions`. The next site
build pulls FocusMate's session count from Beeminder and the bar
fills in automatically.

## How the sync works under the hood

Every build (`prebuild`) and every 23:45 MST daily run does this for
every metric with a non-empty `beeminderSource`:

1. **GET** `beeminder.com/api/v1/users/{you}/goals/{beeminderSource}/datapoints.json`
2. Convert each datapoint to a `{date, value}` entry
3. Cache to `content/goals/cache/beeminder-metrics.json`
4. The goals loader treats those entries the same as manually-logged
   ones — they get summed within the goal's `[startDate, deadline]`
   range.

## Important — keep the goal one-way

The **FocusMate-source Beeminder goal should not also be in any website
goal's `beeminderSlug` field**. If both were set, the website would
push datapoints up while FocusMate was also pushing, and the value
would double-count.

Practical rule:
- `beeminderSource` on a metric → website **reads** from that Beeminder goal
- `beeminderSlug` on a goal → website **writes** to that Beeminder goal

Don't point both at the same Beeminder slug.

## Troubleshooting

- **Website shows 0 FocusMate sessions but Beeminder has them.** The
  build hasn't run since you set things up. Trigger a deploy
  (Actions → Deploy to AWS → Run workflow) or wait for 23:45 MST.
- **Beeminder shows 0 even though you completed sessions.** Check
  FocusMate's integration page — re-auth if it says "disconnected."
- **Metric pulls from the wrong Beeminder goal.** The
  `beeminderSource` field on the metric is the slug, not the title.
  Double-check via Beeminder's URL: `beeminder.com/{you}/SLUG/`.
