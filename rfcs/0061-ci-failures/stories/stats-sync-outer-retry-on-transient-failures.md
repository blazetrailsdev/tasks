---
title: "stats sync: cron-wrapper outer retry must cover transient gh failures, not only rate limits"
status: draft
updated: 2026-09-15
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#7776 taught `isTransientGhError` (`scripts/sync-stats/gh-transient-error.ts`) to match gh's `unexpected end of JSON input`, so the `gh()` retry arm in `scripts/sync-stats/sync.ts` (the `isTransientGhError(msg)` branch, backoff `min(30_000, 2_000 * 2**attempt)`, `MAX_RETRIES = 5`) now covers it. That arm retries for at most ~60 s in total (2+4+8+16+30).

The 2026-09-15 outage was longer than that window. The nightly run at 10:00 UTC failed on `gh pr list --limit 1000 ... --json ...,body,...`; a manual rerun at 12:34 UTC failed identically; the same command succeeded at ~12:50 UTC. So a 60 s in-process retry would very likely NOT have rescued the nightly run.

`scripts/sync-stats/cron-wrapper.sh` has a second, outer retry (wait 120 s, rerun the whole sync) but it fires only on rate-limit signals (`grep -qi "rate limit\|secondary rate\|abuse detection"`), not on transient transport/parse failures.

## Acceptance criteria

- The wrapper's outer retry also fires when the failed run's output matches the transient set (stream error, unexpected EOF, `unexpected end of JSON input`, 502/503/504), with a materially longer cooldown than 120 s (e.g. two attempts spaced ~30 min), so an outage of an hour or two still yields a synced night.
- The cooldown/attempt count is configurable by env var in the same style as `STALE_HOURS`.
- A failing retry still emits the single `[cron-wrapper] stats sync failed ...` verdict line btwhooks matches.
- Unit coverage in `scripts/sync-stats/` for the transient-set matching that the wrapper reads (share `gh-transient-error.ts` rather than duplicating the regex in bash where possible).
