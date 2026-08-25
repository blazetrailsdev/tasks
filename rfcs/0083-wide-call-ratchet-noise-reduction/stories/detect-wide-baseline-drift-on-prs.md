---
title: "Detect wide ratchet baseline drift on PRs, not after merge"
status: done
updated: 2026-08-02
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5908
claim: "2026-08-02T19:07:23Z"
assignee: "detect-wide-baseline-drift-on-prs"
blocked-by: null
closed-reason: null
---

## Context

PR #5899 removed the drift maintenance-PR automation (`scripts/ci/open-wide-baseline-pr.sh`,
added by #5882) on the owner's directive: "We should never let anything red get
into main to begin with, I don't want true up prs."

That removes the after-the-fact remedy but not the underlying gap. The
`Wide ratchet baseline reseed (main)` step in `.github/workflows/ci.yml` (around
line 1493) is gated `if: github.event_name != 'pull_request'`, so a PR can merge
with `scripts/api-compare/call-mismatches-wide-exclude/` and
`scripts/api-compare/call-mismatches-wide-unreviewed.json` out of sync with a
clean reseed. The drift is only detected post-merge on `main`, at which point
every branch cut afterwards inherits the wide-gate failure — the cost #5869
paid, and the reason #5882 existed at all.

The separate `Wide call-mismatches ratchet` step does run on PRs, but it gates
the artifact against the committed baseline; it does not verify that the
committed baseline equals a clean reseed.

## Acceptance criteria

- The reseed-drift check runs on `pull_request` events, failing the PR that
  introduces the drift rather than the `main` run after it merges.
- A PR whose changes make the committed wide baseline stale fails the
  `rails-comparison` job with the existing `::error title=Wide ratchet baseline
drift` annotation and diff output.
- The `main`-only arm is either kept as a backstop or removed deliberately, with
  the choice noted at the call site.
- No maintenance-PR / true-up machinery is reintroduced.
