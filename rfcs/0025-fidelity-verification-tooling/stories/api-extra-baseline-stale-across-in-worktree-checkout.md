---
title: "api:extra baseline is stale across an in-worktree checkout"
status: ready
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while measuring the `api:extra` gate for PR #5392 (a comment-only diff, so
every package total should have been identical to baseline).

Measuring baseline the documented way — `git checkout --detach origin/main` in the
same worktree, run `pnpm api:compare` then `pnpm api:extra`, then check the branch
back out — produced different extra-surface totals for packages the diff never
touched:

| package      | branch run | origin/main run |
| ------------ | ---------- | --------------- |
| trailties    | 147        | 149             |
| actionview   | 89         | 91              |
| activerecord | 200 files  | 199 files       |

The diff touched only `activerecord` and `activemodel`, and changed no executable
line, so `trailties` and `actionview` cannot legitimately move.

This is NOT per-run randomness. Two back-to-back `pnpm api:compare` +
`pnpm api:extra` runs at the same commit (`f6686d477`), with no checkout in
between, are byte-identical:

```text
run 1: activerecord 199 420 915 1335 58 | trailties 53 61 88 149 1 | actionview 21 34 58 92 1
run 2: activerecord 199 420 915 1335 58 | trailties 53 61 88 149 1 | actionview 21 34 58 92 1
```

The drift appears only when the working tree changes commit between runs, which
points at the shared TS extraction cache serving entries keyed on state that does
not fully capture the checked-out file contents.

Why it matters: "api:compare / test:compare delta is non-negative" is the merge
gate on every PR, and the standard way to produce the baseline is exactly this
in-worktree checkout. A stale baseline silently produces phantom deltas on
untouched packages, which either masks a real regression or forces an agent to
argue that a delta it just measured is not real (which is what happened here).

Prior work in this family is all closed — `api-compare-cached-vs-fresh-extraction-divergence`,
`api-compare-cache-key-resolved-read-set`, `api-compare-shared-worktree-cache` — so
this is a recurrence rather than a duplicate.

## Acceptance criteria

- Reproduce: at one commit capture `api:extra` totals, `git checkout --detach
origin/main`, re-run, check back out, re-run; assert the first and third runs
  agree for every package.
- Root-cause which part of the cache key fails to change across an in-worktree
  checkout (candidates: mtime-based invalidation, a read-set hash computed before
  checkout, or the cross-worktree shared cache directory).
- Fix so that a checkout-based baseline is trustworthy, or — if that cannot be
  made sound — make the baseline path fail loudly rather than emit stale totals,
  and document the supported way to baseline.
- Add a regression test covering the checkout-between-runs sequence.
