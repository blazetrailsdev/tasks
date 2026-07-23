---
title: "Preflight attribution scan has no retry; gh api 503 red-lines every PR"
status: ready
updated: 2026-07-23
rfc: "0061-ci-failures"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The Preflight step "Forbid Claude attribution in commit messages" runs
under `set -euo pipefail` and calls `gh api` twice with no retry:

````text
count=$(gh api "repos/$REPO/pulls/$PR_NUMBER" --jq '.commits')
messages=$(gh api --paginate "repos/$REPO/pulls/$PR_NUMBER/commits" ...)
```text

On #4978 this failed with:

```text
gh: No server is currently available to service your request. (HTTP 503)
```text

The step never evaluated a single commit message — the branch was clean
(the CI regex matches 0 lines across all 4 commits). A transient GitHub
API blip therefore red-lines Preflight on every open PR at once, and each
needs a manual re-run.

Observed at least twice in one session; interactive `gh` calls were
503-ing over the same window.

## Acceptance criteria

- Both `gh api` calls retry with backoff before failing the step.
- A 503/transport failure is reported distinctly from an actual
  attribution match, so the error message is not misleading.
- A genuine attribution hit still fails the job.
````
