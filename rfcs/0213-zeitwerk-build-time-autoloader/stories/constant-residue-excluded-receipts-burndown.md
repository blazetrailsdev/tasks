---
title: "constant-residue.json excluded exports converge or carry receipts"
status: draft
updated: 2026-11-03
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9655 made `scripts/api-compare/class-paths.ts` write the constant tables from `walkConstants` plus `scripts/api-compare/constant-residue.json`. Each package's `excluded` list in that record holds the walked exports that have no `rails-api.json` pairing. There are 1,062 in total, 624 of them in activerecord. `unreceiptedExclusions` makes the list only-shrink against the merge-base: a key that is new to `excluded` needs a `@noRailsEquivalent PERMANENT|CONVERGEABLE <story-id>` receipt on the class's own JSDoc (`isReceipted`). The 1,062 keys already listed were seeded without receipts, so they are unreviewed invented surface (CLAUDE.md § "A documented deviation is debt, not permission").

## Acceptance criteria

- Each seeded `excluded` key is converged in one of three ways:
  - renamed or moved to the Rails constant it ports, so the pairing gives it a row;
  - deleted, if it is invented surface with no use;
  - given a `PERMANENT` or `CONVERGEABLE <story-id>` receipt at its declaration.
- `unreceiptedExclusions` drops its "before any base record carries `excluded`" no-op, so every excluded key needs a receipt and the seeded list stops being exempt.
- Work package by package, one PR each, starting with activerecord (624 keys).
- `pnpm parity:class-paths --check` stays green.
