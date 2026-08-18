---
title: "Sweep includes/preload call sites onto the colon spelling: associations remainder"
status: blocked
updated: 2026-08-18
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: "2026-08-18T19:27:39Z"
assignee: "converge-includes-preload-colon-sweep-associations-remainder"
blocked-by: "Blocked on converge-preloader-branch-colon-symbol-entry-point, which is claimed (by converge-includes-preload-colon-sweep-associations-eager-test) but not yet merged to main. Verified empirically on 426be277f: flipping one call site to the colon spelling (cascaded-eager-loading.test.ts:399 preload({':author': {':comments': ':post'}})) raises AssociationNotFoundError from Branch.groupedRecords (branch.ts:166) because Branch#_normalizeAssociationName (branch.ts:305-322) still passes the string through unchanged. Every includes/preload site in both clusters routes through that entry point, so no part of the sweep can land first without stacking. Re-schedule once the entry-point story merges. Note also: the two clusters together are 393 literal call sites across associations/, relation/ and test-helpers/ (~786 LOC add+del), so they should be scheduled as separate PRs, not one bundle."
closed-reason: null
---

## Context

Cluster split of `sweep-includes-preload-call-sites-onto-the-colon-symbol-spelling`,
which is ~800 literal call sites across 131 files in `packages/activerecord/src` —
far past the PR ceiling as one change. `sweep-joins-call-sites-onto-the-colon-symbol-spelling`
(PR #6704) did the same job for `joins` / `leftOuterJoins` at ~660 LOC across 52
files, which is the size one cluster should land at.

Rails passes association names to `includes` / `preload` / `eager_load` /
`references` as Symbols (`relation/query_methods.rb`, e.g. `:88-101`), and
CLAUDE.md spells a Ruby Symbol as a colon-prefixed string. trails' `joins` values
now carry that spelling while the includes family does not, so the two value sets
disagree where Rails has Symbols on both sides.

This story covers the `associations/` tree under `packages/activerecord/src`, excluding `eager.test.ts` (~180 literal call sites).

Depends on `converge-preloader-branch-colon-symbol-entry-point`, which adds the
one colon strip at `Preloader::Branch#_normalizeAssociationName` (mirroring
`associations/join-dependency.ts:933`) that makes the colon spelling resolve.

## Converged shape

Every `includes` / `preload` / `eagerLoad` / `references` call site in scope that
passes an association NAME passes it colon-prefixed — including nested-hash and
array forms, keys and values alike. Raw strings naming a TABLE for `references`
stay bare: Rails passes those as Strings (`query_methods.rb`, `references!`).

## Acceptance criteria

- [ ] Every in-scope association-name call site uses the colon spelling.
- [ ] No new normalization site is introduced anywhere; the strip stays at the
      `JoinDependency` / `Preloader::Branch` entry points.
- [ ] Generated SQL unchanged on all three adapters; no test name touched.
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas non-negative;
      `parity:api:calls` / `:args` clean.
