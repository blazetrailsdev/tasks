---
title: "Pipeline-derived parity marks compare against main's CI artifact, not a committed JSON"
status: in-progress
updated: 2026-10-20
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9141
claim: "2026-10-20T16:45:26Z"
assignee: "parity-marks-compare-against-main-artifact"
blocked-by: null
closed-reason: null
---

## Context

trails#9129 showed that a reduce-only burndown needs no committed mark when the base value can be recomputed: `parity:types:casts` reads it at the merge-base with `git grep`. The pipeline-derived marks are where most of the merge-conflict churn is (commits in the 30 days to 2026-10-20):

- `scripts/test-compare/assertion-mismatch-mark.json`: 34
- `scripts/api-compare/block-param-mark.json`: 20
- `scripts/api-compare/extra-surface-mark.json`: 11 (+ `extra-surface-internal-mark.json`)
- `scripts/api-compare/arm-throw-mark.json`: 9
- `scripts/api-compare/param-name-mark.json`, `predicate-kind-mark.json`

Recomputing these at the base means running `parity:api` / `parity:test` a second time (minutes, needs vendor/rails), so a git-grep base is not enough.

## Acceptance criteria

- Main's CI uploads the comparison outputs each gate reads, keyed by commit SHA.
- On a PR, each gate downloads the outputs for its base (current `origin/main` tip / the merge commit's first parent) and compares per package/file against them, with the same only-shrink semantics. If no artifact exists for that SHA, it falls back to recomputing on a base worktree.
- Start with `assertion-mismatch-mark.json`. Each later mark converts in its own PR.
- For each converted mark, the JSON file, its `:tighten` script and the stale-high-water-mark arm are deleted. The stats DB import reads main's artifact instead.
