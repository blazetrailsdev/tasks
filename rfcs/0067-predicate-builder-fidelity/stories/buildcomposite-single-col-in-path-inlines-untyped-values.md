---
title: "buildComposite single-col IN path inlines raw untyped values instead of binds"
status: draft
updated: 2026-07-24
rfc: "0067-predicate-builder-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`PredicateBuilder#buildComposite`'s single-column degenerate branch
(`packages/activerecord/src/relation/predicate-builder.ts:467-472`) emits
`attribute.in(values)` with the RAW tuple values. Arel wraps those as
`Nodes::Casted`, so they are inlined into the SQL string — they never
become `QueryAttribute` binds and never pass through the column's type.

The multi-column branch in the same method does the opposite: every value
goes through `buildBindAttribute` → `QueryAttribute` → `BindParam`
(`predicate-builder.ts:496-501`), and `composite-where.test.ts` has a
dedicated test asserting exactly that ("composite predicate values flow
through QueryAttribute (bind params, not inlined Casted)"), with a comment
recording that inlining "breaks compileWithBinds / prepared-statement
caching" and "mishandles `StatementCache::Substitute` placeholders".

So the arity of the column list silently decides whether values are bound
and type-cast. After #5186 this also means a qualified single col
(`where(["comments.post_id"], [[1]])`) resolves its ATTRIBUTE on the
joined table but still inlines its values untyped — the type fix does not
reach the `IN` path.

Rails has no such split: `where(key => array)` routes through
`ArrayHandler` (`relation/predicate_builder/array_handler.rb`), which
builds the `IN` list from `predicate_builder.build_bind_attribute` values.

## Acceptance criteria

- [ ] The single-column `IN` path builds bind attributes through the
      resolved column's type (matching `ArrayHandler`), so values are
      type-cast and prepared-statement-cacheable like the multi-col path.
- [ ] Regression test: a single-col composite with a string value for an
      integer column binds as an integer, and the emitted SQL uses bind
      placeholders rather than inlined literals. Must fail on baseline.
- [ ] The existing "single-column composite uses IN(...) (not OR-chain)
      for compactness" test is updated for the bind form WITHOUT being
      renamed.
- [ ] No test renames; api:compare / test:compare delta non-negative.
