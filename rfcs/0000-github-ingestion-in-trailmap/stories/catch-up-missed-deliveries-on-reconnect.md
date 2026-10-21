---
title: "trailmap: backfill events missed while a forwarder was disconnected"
status: ready
updated: 2026-10-21
rfc: "0000-github-ingestion-in-trailmap"
cluster: null
packages: []
deps: [run-gh-webhook-forward-as-an-ingest-process]
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

**Lands in:** trailmap.

## Context

GitHub queues nothing for a dev hook while it's disconnected. During the audit
phase, ringo heals the gap from its direct hooks. After the hooks are gone,
this story is the only cover, so `delete-ringo-github-hooks-and-poll-ingest`
depends on it.

**The source is REST state.** An inactive hook receives no deliveries, so it
has nothing to backfill from (rejected in the RFC's Alternatives). On every
forwarder (re)connect, the supervisor lists what changed since the cursor:
PRs (`pulls?state=all&sort=updated`), reviews and review comments on those
PRs, check runs and workflow runs for their head SHAs, and pushes from the
repo's events feed. For each one with no stored delivery, it writes a
**synthetic** `GithubDelivery` (`synthetic: true`, payload shaped like the
webhook's, `occurred_at` from the object).

- **The cursor** is the newest `occurred_at` for the repo, never
  `received_at`, because backfilled rows arrive later than the events they
  replay.
- **With no rows yet** (a newly enabled repo), the floor is
  `RepositorySetting.ingest_enabled_at`. It backfills nothing from before
  ingestion was enabled.
- **Window cap:** 24 h. A longer gap is logged on the deliveries page instead.

## Acceptance criteria

- [ ] With `ingest` stopped for 5 minutes while a PR is opened and closed, both appear (synthetic) after restart
- [ ] A synthetic row never duplicates a live one (match on subject id + action + occurred_at)
- [ ] A new repo backfills nothing from before `ingest_enabled_at`
- [ ] No state file is written
