---
title: "constant-residue.json excluded exports converge or carry receipts"
status: done
updated: 2026-11-03
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9665
claim: "2026-11-03T13:36:41Z"
assignee: "constant-residue-excluded-receipts-burndown"
blocked-by: null
closed-reason: null
---

## Context

trails#9655 made `scripts/api-compare/class-paths.ts` write the constant tables from `walkConstants` plus `scripts/api-compare/constant-residue.json`. Each package's `excluded` list in that record holds the walked exports that have no `rails-api.json` pairing. There are 1,062 in total, 624 of them in activerecord. `unreceiptedExclusions` makes the list only-shrink against the merge-base: a key that is new to `excluded` needs a `@noRailsEquivalent PERMANENT|CONVERGEABLE <story-id>` receipt on the class's own JSDoc (`isReceipted`). The 1,062 keys already listed were seeded without receipts, so they are unreviewed invented surface (CLAUDE.md § "A documented deviation is debt, not permission").

Most of those keys turned out not to be invented surface. They were exports in files `placement` gives no table (test-tree mirrors under `test-helpers/`, files outside the entry graph such as the PG/MySQL/SQLite adapters), so no table could ever have seated them, and many are real Rails classes. The record now counts only seatable exports (112 keys, 6 in activerecord); the unseatable real Rails classes are tracked by `unplaced-rails-classes-get-a-constant-table`.

## Acceptance criteria

- `excluded` lists only walked exports `placement` can seat.
- activerecord's seated `excluded` keys are each converged (renamed or moved to the Rails constant, deleted if invented and unused) or carry a `PERMANENT` / `CONVERGEABLE <story-id>` receipt at the declaration.
- `unreceiptedExclusions` drops its "before any base record carries `excluded`" no-op.
- The other packages' keys, and dropping the seeded-list exemption, belong to `constant-residue-excluded-other-packages-receipts`.
- `pnpm parity:class-paths --check` stays green.
