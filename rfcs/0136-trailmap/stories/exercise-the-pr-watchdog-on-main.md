---
title: "trailmap: the PR watchdog's comment-and-fail path has never run"
status: ready
updated: 2026-10-15
rfc: "0136-trailmap"
cluster: null
packages: []
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

trailmap#63 added `.github/workflows/pr-watchdog.yml` and
`scripts/ci/prs-without-runs.sh`. A scheduled workflow only runs from `main`,
so before merge only the script's empty case was exercised (no stuck PR
existed). The comment step, its `pr-watchdog:no-run` once-only marker and the
failing exit are untested.

## Acceptance criteria

- [ ] The first scheduled runs on `main` are green with no open stuck PR (link the run)
- [ ] The stuck path is exercised once: the script prints a PR whose head has no run, the workflow comments exactly once across two ticks, and fails
- [ ] The script has a `--self-test` against a canned `gh`, as `smoke-prod.sh` has, so CI holds it
