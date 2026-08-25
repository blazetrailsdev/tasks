---
title: "parity:api: resolve superclass/mixin short-name collisions by declaring file"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 5948
claim: "2026-08-03T01:55:46Z"
assignee: "api-compare-resolve-superclass-and-mixin-shortnames-by-declaring-file"
blocked-by: null
closed-reason: null
---

## Context

PR #5929 renamed `PostgreSQLSchemaStatements` to Rails' `SchemaStatements`.
That rename originally LOST a matched method because `include(Host, X)` edges
are recorded by the bare short name (`extract-ts-api.ts:1101`) and
`resolveParent` (`compare.ts:1549`) broke a duplicated short name by counting
shared leading path segments — with `SchemaStatements` now declared in
`connection-adapters/abstract/`, `postgresql/` and `sqlite3/`, the tie landed on
the abstract class. #5929 fixed that ONE path: include/extend edges now carry
`ClassInfo.extendsFiles` (short name -> declaring file) and `resolveParent`
prefers an exact file match.

The other short-name resolution sites were left on the old heuristic and will
mis-resolve the same way as more classes take their faithful (and therefore
colliding) Rails names:

- `compare.ts:1590` — `entity.superclass` is resolved by `resolveParent` with no
  declaring-file hint; the extractor records the superclass by short name only.
- `compare.ts:1071` / `compare.ts:1139` — the include-graph walk resolves
  `includes`/`extends` names through a short-name map.
- `extra-surface.ts:877` — `walkMixin` resolves `info.extends` entries by name.

## Acceptance criteria

- The extractor records a declaring file for `superclass` the same way
  `extendsFiles` records it for include/extend edges, and `resolveParent` uses
  it.
- The remaining short-name resolution sites above either consume the recorded
  declaring file or are documented (with a test) as unable to collide.
- Unit tests in `scripts/api-compare/` reproduce a duplicated short name for
  each converted site and assert the correct candidate wins.
- parity:api data-layer total non-negative (>= the total at claim time).
