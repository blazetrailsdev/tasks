---
title: "schedule-continuous-trails-tracking"
status: draft
updated: 2026-09-09
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/track-trails.sh` (tasks repo) is the whole continuous-tracking job and
is written to be cron-safe — idempotent, exits 0 when already current, refuses
to promote into a dirty main checkout, and rolls back rather than leaving a
broken install. What it does not have yet is anything that _runs_ it.

Until it is scheduled, tracking is continuous only in the sense that a human
can run one command. Bounded staleness is the entire benefit and the bound is
whatever this schedule turns out to be.

The scheduler lives outside this repo, which is why it is a separate story: the
host's crontab, or a btwhooks job beside the existing ones. It needs a checkout
of tasks and network access to trails, both of which the box already has, and
it must NOT run inside the btwhooks container — the promotion step writes the
main checkout's `node_modules`, which the container bind-mounts.

## Expected shape

- The job runs `pnpm trails:track` on the host on an interval (hourly is a
  reasonable starting bound; the script is a no-op when already current, and
  the expensive part — a trails `pnpm build` — only happens when main moved).
- Its non-zero exit is delivered somewhere a person sees it. The script already
  prints the failing stage, the log path, and the `pnpm tasks new` command with
  a written story body; the schedule just has to not discard that.
- `pnpm trails:status` is exposed somewhere ambient — the dashboard is the
  obvious home — so "which trails is the fleet on, and how far behind" is
  answerable without ssh.

## Acceptance criteria

- `pnpm trails:track` runs unattended on a stated interval, on the host.
- A failed run reaches a human (not just a log file nobody opens).
- The README's tracking section names where the schedule lives.
- Demonstrated: the pin moves on its own at least once, with the bump commit
  attributable to the job.
