---
title: "Open a maintenance PR from the main wide-ratchet reseed instead of only failing"
status: done
updated: 2026-08-02
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5882
claim: "2026-08-02T12:59:09Z"
assignee: "open-maintenance-pr-for-wide-baseline-drift"
blocked-by: null
closed-reason: null
---

## Context

PR #5874 added the `Wide ratchet baseline reseed (main)` step to the
`Rails API/Test Comparison` job in `.github/workflows/ci.yml` (non-`pull_request`
events only). It runs `lint-call-mismatches-wide.ts --write` and fails the job
with an `::error` annotation plus the row diff when the committed baseline is
out of sync with a clean reseed.

Failing is the cheaper half of the acceptance criteria on the
`reseed-wide-ratchet-baseline-on-main` story ("open a maintenance PR **or** fail
loudly"). The residual gap: nothing acts on the failure. `main` stays stale until
a human notices the red run and hand-reseeds, and in the meantime every branch
cut from `main` still inherits the wide-gate failure — the exact cost #5869 paid.

## Acceptance criteria

- On a drift detection in the main reseed step, open (or update) a maintenance
  PR carrying the reseeded `scripts/api-compare/call-mismatches-wide-exclude/`
  and `call-mismatches-wide-unreviewed.json`, titled so the causing merge SHA is
  identifiable.
- Reuse an existing PR/branch rather than opening one per merge, so a run of
  consecutive drifting merges produces one open PR, not N.
- The step still fails (or is clearly reported) so the drift is visible even if
  the PR is missed.
