---
title: "burn-down-the-declaration-only-population"
status: draft
updated: 2026-08-28
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7159 (RFC 0126) stopped `parity:api` crediting a Ruby method against a TS
name whose only declaration in the mirrored file is a bodyless signature — an
`interface`/`type` member, or an object-literal member that is a bare reference
to a function declared elsewhere. The new `DeclOnly` column measures the
population for the first time: **275 methods**, spread as

| package | declaration-only |
| --- | --- |
| activerecord | 202 |
| activemodel | 14 |
| abstractcontroller | 14 |
| activesupport | 12 |
| actiondispatch | 9 |
| trailties | 7 |
| arel | 5 |
| rack | 5 |
| actioncontroller | 4 |
| actionview | 3 |

The two largest single files:

- `packages/activerecord/src/relation.ts` — 82. The `interface Relation`
  declares the finder/calculation members and the bodies live under
  `relation/*.ts` under RENAMED identifiers: `find_sole_by`
  (`relation/finder_methods.rb:143`) is `performFindSoleBy`, reached only
  through an object-literal `findSoleBy: performFindSoleBy`
  (`relation/finder-methods.ts:638`). The settled trails mixin shape is a
  `this`-typed function at the RAILS name (CLAUDE.md "Module mixins"), so the
  `perform` prefix is name drift, not the sanctioned idiom.
- `packages/activerecord/src/connection-adapters/postgresql-adapter.ts` — 71.

Reproduce the current list with:

```sh
pnpm parity:api --package <pkg> --missing   # rows tagged [declaration-only]
```

`arel-crud-interface-holds-no-bodies` (RFC 0124) already owns arel's `crud.ts`
four. This story is the tracking parent for the rest: split it per file or per
cluster as the work is claimed, biggest file first.

## Acceptance criteria

- Per claimed slice, the Ruby method's TS body lives in the file mirroring its
  Rails file, at the name `docs/ruby-ts-conventions.md` produces — no `perform`
  prefix, no indirection the Ruby does not have.
- `pnpm parity:api --package <pkg> --missing` shows no `[declaration-only]` row
  for the converged slice, and the package's matched count rises by the same
  number.
- No baseline row, `@noRailsEquivalent` tag, or `SKIP_GROUPS` entry is added to
  make a row disappear — the column shrinks by porting, not by allowlisting.
