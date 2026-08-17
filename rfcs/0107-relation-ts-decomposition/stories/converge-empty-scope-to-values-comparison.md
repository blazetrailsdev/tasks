---
title: "isEmptyScope compares values against model.unscoped.values"
status: done
updated: 2026-08-17
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6627
claim: "2026-08-17T02:22:52Z"
assignee: "converge-parameter-filter-ignore-case-onto-inline-group"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while shipping #6618 (`inline-relation-where-family-private-helpers`), which
inlined the invented `_whereMatchesUnscopedBaseline` helper into `isEmptyScope` but left
the comparison shape alone to keep the diff scoped and behaviour unchanged.

Rails (`activerecord/lib/active_record/relation.rb:1299`) is one line:

```ruby
def empty_scope? # :nodoc:
  @values == model.unscoped.values
end
```

`packages/activerecord/src/relation.ts` (`isEmptyScope`) instead hand-enumerates ~20
value slots — `orderValues`, `limitValue`, `offsetValue`, `selectValues`,
`readonlyValue`, `unscopeValues`, `distinctValue`, `groupValues`, `havingClause`,
`_joinClauses`, `joinsValues`, `leftOuterJoinsValues`, `includesValues`,
`eagerLoadValues`, `preloadValues`, `lockValue`, `fromClause`, `withValues`,
`annotateValues`, `optimizerHintsValues` — plus a bespoke WHERE-vs-unscoped-baseline SQL
comparison for the STI `type_condition` case.

Every slot Rails gains, or trails adds, is a slot this chain can silently miss: the
comment history in that getter records two such misses already (`readonly` and
`unscope_values`, each of which dropped a reflection scope on the preload
through/HABTM source path until it was added by hand).

`Relation#values` already exists (`relation.ts`, mirroring relation.rb:1281-1283 —
`@values.dup`), and `model.unscoped` exists, so the raw materials for the Rails
comparison are present.

## Converged shape

`isEmptyScope` becomes the relation.rb:1299 comparison — this relation's `values`
against `model.unscoped.values` — with no per-slot enumeration. The STI case has to keep
working: `unscoped` on a finder-needs-type-condition class carries the `type_condition`
in its own values, which is precisely why Rails' comparison handles it without a special
case; confirm that trails' values hash represents the where clause comparably (the
current code compares predicate SQL through the connection because the WhereClause
objects are not value-equal) and converge whatever blocks a plain comparison.

## Acceptance criteria

- [ ] `isEmptyScope`'s body is the relation.rb:1299 comparison, with no hand-enumerated
      value slots and no bespoke WHERE-SQL comparison.
- [ ] The STI `type_condition` case still reports an empty scope for an unscoped
      subclass relation; the preload through/HABTM `readonly`/`unscope` regressions the
      current chain guards against stay fixed (they are covered by the association
      suites).
- [ ] `_whereClauseToSql` (`relation.ts`, a trails-only glue function with no Rails
      counterpart) is deleted if nothing else consumes it.
- [ ] `pnpm parity:api:calls` / `:args` green; `parity:api:extra` for `relation.ts` does
      not grow.
