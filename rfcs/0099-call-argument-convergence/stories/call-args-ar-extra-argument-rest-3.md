---
title: "call-args-ar-extra-argument-rest-3"
status: done
updated: 2026-08-12
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6412
claim: "2026-08-12T13:26:03Z"
assignee: "call-args-ar-extra-argument-rest-3"
blocked-by: null
closed-reason: null
---

# Converge the remaining structural extra-argument call sites (rest-3)

## Context

Fourth slice of RFC 0099 bucket (a). `call-args-ar-extra-argument-rest-2`
converged the four rows whose fix was a one-line dispatch through an EXISTING
class-level surface:

- `counter-cache.ts` `_create_record` / `destroy_row` →
  `this.constructor.counterCachedAssociationNames()` (counter_cache.rb:203,214)
- `insert-all.ts` `resolve_sti` → `this.model.stiName()` (insert_all.rb:108)
- `table-metadata.ts` `reflect_on_aggregation` →
  `this._klass?.reflectOnAggregation(name)` (table_metadata.rb:66)

Everything else listed in `call-args-ar-extra-argument-rest-2` is still open —
each needs a `this`-typed function / real method conversion, a value-object
constructor, or a threaded collaborator. Regenerate the live list with
`pnpm parity:api:calls:args` and
`scripts/api-compare/output/call-arg-mismatches.json`
(filter `package == "activerecord" && class == "shape"`); the current count is
135 rows, headed by:

- `tasks/database-tasks.ts` (10) — needs `databaseAdapterFor` to return a
  constructed task (`tasks/database_tasks.rb:362-374`)
- `nested-attributes.ts` (9), `inheritance.ts` (7),
  `relation/calculations.ts` (7), `relation.ts` (6), `store.ts` (6),
  `autosave-association.ts` (5), `scoping/default.ts` (5)
- long tail of 1-4 row files (`token-for.ts`, `reflection.ts`,
  `associations/alias-tracker.ts`, `middleware/shard-selector.ts`, …)

The cluster-by-cluster breakdown, with the Rails `file:line` and the shape of
each fix, is in the `call-args-ar-extra-argument-rest-2` story body — reuse it
rather than re-deriving.

## Acceptance criteria

1. Each converged call site passes what the Rails body passes, verified
   against the vendored Rails file named on the row.
2. Baseline rows are DELETED by hand (only-shrink; never `--write`).
3. `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
4. Split across as many PRs as the LOC ceiling requires; one cluster is
   roughly one PR, each branched from `main` with non-overlapping files.
