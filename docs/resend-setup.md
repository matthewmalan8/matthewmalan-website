# Resend setup for accountability buddy emails

The `Check failed goals` workflow runs every day at 6 AM UTC. It reads
every active goal, finds the ones whose deadline has passed, and emails
the accountability buddy linked to each one (when `notifyOnFailure` is
on). Emails go out via [Resend](https://resend.com) — free tier covers
100 emails/day, plenty for this use.

If the secrets below aren't set the workflow exits cleanly without
sending anything.

## 1. Create the Resend account

1. Sign up at https://resend.com (no credit card on the free tier).
2. From the dashboard sidebar, click **Domains → Add Domain** and add
   `matthewmalan.com`. Resend will give you 3 DNS records to add (SPF,
   DKIM, return-path). Add those wherever you manage DNS for the
   domain (Cloudflare, AWS Route 53, etc.) and click **Verify**.
3. Once the domain is verified you can send from any address on it
   (e.g. `accountability@matthewmalan.com`).

> Don't want to deal with DNS yet? Resend lets you send from
> `onboarding@resend.dev` while you set things up. Good for testing,
> not great for production — buddies will see the resend.dev domain.

## 2. Create the API key

1. **API Keys → Create API Key**
2. Name: `goal-failure-notifier`
3. Permission: **Sending access** (not full access — least privilege)
4. Copy the `re_…` key.

## 3. Add the secrets to GitHub

In the repo → **Settings → Secrets and variables → Actions**:

| Type | Name | Value |
|------|------|-------|
| Secret | `RESEND_API_KEY` | the `re_…` key from step 2 |
| Secret | `RESEND_FROM` | `Matthew <accountability@matthewmalan.com>` (or whatever address you verified) |

While you're there, you can also add an Action **variable** (not a
secret) named `GOAL_NOTIFY_DRY_RUN` with value `1`. When set, the
workflow logs what it *would* send but doesn't actually email. Unset
it (or delete the variable) when you're ready to go live.

## 4. Add an accountability buddy

Open https://matthewmalan.com/goals-admin/ → **Accountability
Buddies** → New entry. Fill in:

- **Name**: how the email greets them.
- **Email**: where the notification goes.
- (Notes optional.)

## 5. Wire a goal to the buddy

On any goal in `/goals-admin/`:

- **Accountability buddy** — pick the buddy from the dropdown.
- **Notify buddy on failure** — turn this on.

## 6. Verify it works

You can trigger the workflow on demand:

1. Go to https://github.com/matthewmalan8/matthewmalan-website/actions
2. Click **Check failed goals** in the sidebar
3. Click **Run workflow** → Run

The job log will print either `No newly overdue goals…` or
`Sent → buddy@example.com ("Goal title")`. With dry-run on it'll say
`[notify dry-run] Would email …` instead.

## Caveats / future improvements

- Right now the workflow does NOT flip the goal's status to "failed"
  in the repo. It just emails. You decide whether to mark it failed
  via `/goals-admin/`. Extending this to auto-commit a status change
  is straightforward — say the word.
- Each overdue goal triggers an email every day until you change its
  status. Once you mark it `failed`, no more emails. (If you want
  one-shot "send once and shut up", that's a one-line change.)
- Time zones: the cron runs at 6:00 UTC. In Mesa, AZ (UTC-7) that's
  11 PM the previous day. Edit `.github/workflows/check-failed-goals.yml`
  if you want it at a different local time.
