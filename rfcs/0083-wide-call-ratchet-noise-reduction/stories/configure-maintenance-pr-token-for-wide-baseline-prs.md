---
title: "Configure MAINTENANCE_PR_TOKEN so drift maintenance PRs get CI without a close/reopen"
status: done
updated: 2026-08-02
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 5899
claim: "2026-08-02T15:23:09Z"
assignee: "configure-maintenance-pr-token-for-wide-baseline-prs"
blocked-by: null
closed-reason: null
---

## Context

PR #5882 added `scripts/ci/open-wide-baseline-pr.sh`, which the
`Wide ratchet baseline reseed (main)` step calls on drift to publish the reseed
as a rolling maintenance PR. It authenticates with
`secrets.MAINTENANCE_PR_TOKEN || secrets.GITHUB_TOKEN`
(`.github/workflows/ci.yml`, `rails-comparison` job).

No `MAINTENANCE_PR_TOKEN` secret exists in the repo today, so the script lands
on the `GITHUB_TOKEN` fallback. GitHub does not trigger workflow runs from
events authored by `GITHUB_TOKEN`, so the generated maintenance PR opens with
an empty checks list and cannot satisfy required status checks until a human
closes and reopens it (or pushes to the branch). The script documents this in
the generated PR body, but the manual step is exactly the human latency the
automation exists to remove.

## Acceptance criteria

- A `MAINTENANCE_PR_TOKEN` repository secret is configured (PAT or GitHub App
  installation token with contents + pull-requests write), OR the script is
  changed to trigger the checks itself on the fallback path.
- A drift-triggered maintenance PR arrives with its CI checks already running,
  with no close/reopen needed.
- The fallback caveat block in `open-wide-baseline-pr.sh` is removed or
  narrowed once the token path is the live one.
