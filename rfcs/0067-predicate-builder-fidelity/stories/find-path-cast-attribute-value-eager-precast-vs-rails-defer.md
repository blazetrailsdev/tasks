---
title: "find-path Base._castAttributeValue eager pre-cast diverges from Rails' defer-to-bind casting"
status: done
updated: 2026-07-23
rfc: "0067-predicate-builder-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: 5139
claim: "2026-07-23T12:37:38Z"
assignee: "find-path-cast-attribute-value-eager-precast-vs-rails-defer"
blocked-by: null
closed-reason: null
---

## Context

PR #5065 (relation-where-value-eager-precast-vs-rails-defer) removed the eager
`where`-value pre-cast (`Relation#_castWhereValue` /
`_castPreservingUncastable`) — all four where/whereNot/whereAny/having entry
points now hand values raw to PredicateBuilder, whose QueryAttribute bind
casts/serializes at compile time (Rails' design,
vendor/rails predicate_builder.rb:57-69).

Its surviving sibling is `Base._castAttributeValue`
(packages/activerecord/src/base.ts:2256): string-only eager cast with a sync
`ModelSchema.loadSchema` fallback for a cold primary-key definition. Remaining
callers:

- `core.ts:1011,1025,1046` — `find` / find-family cast ids up front before
  building the where clause. Rails' `find` (core.rb / finder_methods.rb)
  never pre-casts: the id flows raw into `where(primary_key => id)` and the
  QueryAttribute bind owns casting (int8→BigInt included, via the resolved
  IntegerType — see project_bigint_id_fk_pk_fix_belongs_in_type_not_accessor).
- `inheritance.ts:25-31` — STI discriminator cast fallback.

Same shape as the removed where pre-cast: string-only special-casing that can
route non-string scalars differently from Rails' uniform bind serialization,
plus a trails-only sync schema-load side effect on the query path.

## Acceptance criteria

- [ ] Audit whether the `core.ts` find-path callers can pass ids raw, letting
      the bind cast (Rails' design); remove `_castAttributeValue` if all
      callers converge, else document the constraint at the call site.
- [ ] `inheritance.ts` fallback either converges with it or documents why the
      STI discriminator needs an eager cast.
- [ ] Existing find/finder tests (finder.test.ts, relation/finder-methods
      .test.ts) hold; PK slug (`"1-foo"`) and int8→BigInt behavior pinned.
