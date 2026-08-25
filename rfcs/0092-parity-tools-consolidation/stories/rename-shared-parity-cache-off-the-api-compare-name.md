---
title: "Rename the shared cross-worktree cache off api-compare's name and move shared-cache.ts out of its tree"
status: done
updated: 2026-08-09
rfc: "0092-parity-tools-consolidation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6284
claim: "2026-08-09T15:42:26Z"
assignee: "converge-ddl-schema-cache-recording-into-the-ported-ddl-bodies"
blocked-by: null
closed-reason: null
---

## Context

Left open by `test-compare-never-prunes-the-shared-cache-it-writes` (PR #6280),
which wired test-compare's `main()` into `pruneSharedCache` but deliberately did
not rename the directory.

Two tools now read and write one shared directory, and it is named after only
one of them: `sharedCacheDir()` (`scripts/api-compare/shared-cache.ts`) resolves
`<repo>/.git/api-compare-cache/v<N>/`, and test-compare's orchestrator
(`scripts/test-compare/orchestrate.ts`) publishes its `rails-tests` entries
there. The module itself lives under `scripts/api-compare/` while serving both.

No Rails counterpart — trails parity tooling on both sides.

## Converged shape

Rename the directory to something tool-neutral (`parity-cache`, matching the
`parity:*` script namespace RFC 0092 consolidated on) and move
`shared-cache.ts` out of `scripts/api-compare/` to a shared location both
orchestrators import from without one reaching into the other's tree.

The rename is a whole-tree invalidation — every existing entry is orphaned under
the old path — so it is only worth doing as a rider on a `CACHE_VERSION` bump
that was going to invalidate the tree anyway. File it now so the next bump can
pick it up; do NOT bump `CACHE_VERSION` solely to land this.

The old directory must be swept, not abandoned: `pruneSharedCache` only walks
siblings under the _current_ parent, so a rename leaves the entire
`api-compare-cache` tree behind forever in every checkout.

## Acceptance criteria

- [ ] The shared directory has a name that does not claim one of its two
      writers, and `shared-cache.ts` lives outside `scripts/api-compare/`.
- [ ] Landed together with a `CACHE_VERSION` bump, not as a standalone
      invalidation.
- [ ] The superseded `api-compare-cache` tree is removed on first run rather
      than orphaned.
- [ ] `pnpm parity:api` and `pnpm parity:test` both still hit the cache
      cross-worktree after the move.
