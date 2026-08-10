---
title: "converge-relation-subquery-distinct-pk-materialization"
status: draft
updated: 2026-08-03
rfc: "0023-surfaced-deviations"
cluster: null
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

`relation-handler-distinct-pk-materialization` landed as #3383 (RFC 0022, now
closed), but the gap is still open at
`packages/activerecord/src/relation.ts:4719-4746`, which cites that landed story
as "the continuation story".

The site is the relation-as-subquery-value path. Rails' `apply_join_dependency`,
for a limit/offset over non-limitable (collection) reflections, replaces the
relation with `distinct_relation_for_primary_key` (`finder_methods.rb:463`):
it EXECUTES a query (`select_rows`, `schema_statements.rb:1434`) to materialize
the limited DISTINCT primary keys — honouring `columns_for_distinct(...,
order_values)` — rewrites the relation as `WHERE pk IN (ids)`, and clears
`limit_value` / `offset_value`. This avoids `IN (SELECT … LIMIT n)`, which
limits joined rows rather than parents and is unportable (MySQL rejects it).

trails cannot do that here because the predicate builder is synchronous, so
the branch throws `NotImplementedError` with a "materialize the ids first"
message and carries an `@nie disposition=TODO` marker.

This is the sibling of the composite-PK case in
`converge-composite-pk-distinct-relation-materialization`; the blocker here is
the sync predicate builder rather than composite-PK support, so they converge
separately.

## Acceptance criteria

- A relation with an eager-load + limit/offset over a collection association
  works as a subquery value, materializing the limited DISTINCT primary keys as
  Rails does, rather than raising `NotImplementedError`.
- The `@nie disposition=TODO` marker and the stale
  `relation-handler-distinct-pk-materialization` citation at relation.ts:4724
  are removed.
- `pnpm parity:test` delta non-negative.
