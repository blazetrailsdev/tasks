---
title: "Attribution guards fail closed on transient GitHub API 5xx"
status: ready
updated: 2026-07-20
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

On PR #4982 the Preflight job failed with a red "Forbid Claude attribution in
commit messages" step. The PR had exactly one commit and it contained no
attribution of any kind — the step never reached its `grep`. Its entire output
was:

````text
gh: No server is currently available to service your request. (HTTP 503)
##[error]Process completed with exit code 1.
```text

Run: <https://github.com/blazetrailsdev/trails/actions/runs/29710431991/job/88253498021>

Both attribution guards (`.github/workflows/ci.yml:505` body,
`.github/workflows/ci.yml:525` commits) shell out to `gh api` under
`set -euo pipefail`, so any transient GitHub API 5xx fails the step. The
commit-message guard makes two such calls (`ci.yml:545`, `:550`); the body
guard one (`ci.yml:519`).

Two problems:

1. A GitHub API blip reds a PR that has nothing wrong with it, costing a
   full job re-run.
2. The failure is actively misleading: the only thing a maintainer sees in
   the checks UI is the step name, which reads as though an attribution
   violation was found. The first hypothesis on seeing it is that a trailer
   got injected into a commit.

## Acceptance criteria

- [ ] Transient `gh api` failures in both attribution guards do not fail the
      step as if attribution were found — retry with backoff, and/or
      distinguish "API unreachable" from "attribution matched"
- [ ] When the API is genuinely unreachable after retries, the error message
      says so explicitly rather than leaving the bare step name as the only
      signal
- [ ] A real attribution hit still fails the step with the existing message
````
