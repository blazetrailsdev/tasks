---
title: "test-compare publishes shared-cache entries but never prunes, so rails-tests manifests accumulate"
status: done
updated: 2026-08-09
rfc: "0092-parity-tools-consolidation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6280
claim: "2026-08-09T14:59:36Z"
assignee: "fixture-harness-wrappers-restore-own-property-shadowing-prototype"
blocked-by: null
closed-reason: null
---

## Context

`test-compare-shared-ruby-cache` (PR #6276) taught
`scripts/test-compare/orchestrate.ts` to publish and read `rails-tests` entries
in the cross-worktree shared cache, reusing
`scripts/api-compare/shared-cache.ts` (33.8s cold → 10.0s on a hit).

It did NOT wire up the eviction half. `pruneSharedCache` runs only in
`scripts/api-compare/orchestrate.ts`'s Phase D; test-compare's orchestrator
never calls it. Both tools share one directory
(`<repo>/.git/api-compare-cache/v<N>/`), so the `rails-tests` entries a
test-compare run writes are pruned only as a side effect of somebody running
`pnpm parity:api` in some worktree.

Content keys are append-only by construction — every `vendor/sources.lock.json`
bump mints a new key and orphans the old entry forever — so in a checkout that
runs `parity:test` but not `parity:api`, `rails-tests` entries accumulate
without bound. Each is a multi-MB manifest.

## Converged shape

Call `pruneSharedCache(ROOT)` at the end of test-compare's `main()`, guarded by
`!force` and wrapped so a prune failure can never affect the comparison result —
the same shape and the same rationale as api-compare's Phase D
(`scripts/api-compare/orchestrate.ts`, "Runs after the work so a failure here
can never affect the comparison result").

While there: the shared directory is still named `api-compare-cache` though two
tools now write to it. Renaming is a `CACHE_VERSION`-style whole-tree
invalidation, so it is only worth doing if it rides along with one.

## Acceptance criteria

- [ ] A `parity:test` run prunes stale shared-cache entries, api-compare-style.
- [ ] Pruning is best-effort: a failure cannot change the comparison result or
      the exit code.
- [ ] `TEST_COMPARE_FORCE=1` skips the prune, mirroring `API_COMPARE_FORCE`.
