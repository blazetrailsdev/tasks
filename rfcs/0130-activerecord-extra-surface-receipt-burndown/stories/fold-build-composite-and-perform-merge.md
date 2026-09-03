---
title: "fold-build-composite-and-perform-merge"
status: draft
updated: 2026-09-03
rfc: "0130-activerecord-extra-surface-receipt-burndown"
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

Two `relation/` names sit on files that DO have a Rails counterpart, so neither
can be argued away as a trails-only module. After RFC 0130 phase 1 both carry
`@noRailsEquivalent CONVERGEABLE` receipts pointing here.

- `relation/predicate-builder.ts` `buildComposite(cols, tuples)` — Rails builds
  a composite-key predicate through `PredicateBuilder#build`'s
  `TableValue`/`Arel::Nodes::Grouping` path
  (`relation/predicate_builder.rb:31-49`, `arel/nodes/homogeneous_in.rb`), with
  no `build_composite` anywhere. Read by `relation/batches.ts` and
  `relation/query-methods.ts`.
- `relation/spawn-methods.ts` `performMerge` — Rails' `merge`
  (`relation/spawn_methods.rb:36-46`) is one method; the TS file splits the
  body out under a name Rails does not use, and only
  `relation.trails.test.ts` reads the split half (`performSpawn` was folded
  back in RFC 0130 phase 1 because nothing outside the file read it).

## Acceptance criteria

- `buildComposite` is folded into `build`, or renamed to the Rails method whose
  body it is.
- `performMerge` is folded back into `merge`, and `relation.trails.test.ts`
  exercises it through `merge`.
- `relation/predicate-builder.ts` and `relation/spawn-methods.ts` show 0 novel,
  no `@noRailsEquivalent` tag remains on either name, and
  `pnpm parity:api:calls` / `:calls:args` gain no rows.
