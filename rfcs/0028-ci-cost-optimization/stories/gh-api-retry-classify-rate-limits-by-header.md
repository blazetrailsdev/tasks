---
title: "Classify gh api rate limits by response header, not stderr wording"
status: ready
updated: 2026-07-20
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/ci/gh-api-retry.sh` (added in #4995) classifies rate-limit failures
by grepping gh's **stderr wording** — `rate limit|abuse detection|please wait
a few minutes` — rather than the HTTP response headers.

This was deliberate and is correct today: GitHub returns primary and
secondary rate limits as either 403 or 429, while a bare 403 (token missing a
scope) is permanent, so the status code alone cannot separate them (see the
Codex review on #4995 citing GitHub REST "Troubleshooting the REST API >
Rate limit errors").

But it couples the classifier to undocumented CLI output. If gh rewords its
errors, rate limits silently reclassify as non-transient and fail fast again
— failing honestly ("non-transient error"), not as a false attribution hit,
which is why this was accepted rather than blocking the merge.

Two improvements:

1. Classify on response headers (`x-ratelimit-remaining: 0`, `retry-after`)
   instead of stderr prose — e.g. via `gh api -i` or `--include`.
2. Honor the `Retry-After` / `x-ratelimit-reset` delay instead of the
   hardcoded `RATE_LIMIT_DELAY=60`. GitHub asks callers to wait the indicated
   interval; 60s is a floor guess.

Note the constraint that forced the current shape: Preflight runs under
`timeout-minutes: 10` and makes three of these calls, so any honored delay
must stay bounded (`RATE_LIMIT_MAX_ATTEMPTS=3` exists for this reason) — a
long `Retry-After` should bail with the explicit message rather than sleep
past the job budget.

## Acceptance criteria

- [ ] Rate-limit detection no longer depends on gh's stderr wording
- [ ] Honored backoff derives from `Retry-After`/`x-ratelimit-reset` when present
- [ ] Total sleep stays bounded so Preflight cannot hit `timeout-minutes: 10`
      and die as a bare "cancelled"
- [ ] Existing classification behavior preserved: 5xx/transport retries fast,
      bare-403/404 fails immediately, both messages still state that the
      attribution scan never ran
