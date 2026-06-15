---
title: "PredicateBuilder#build derefs an AR instance value to its id (where(col: instance))"
status: ready
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails' `PredicateBuilder#build`
(`vendor/rails/activerecord/lib/active_record/relation/predicate_builder.rb:57-58`)
dereferences an Active Record instance to its id **as the first thing it does**,
before any handler dispatch:

```ruby
def build(attribute, value, operator = nil)
  value = value.id if value.respond_to?(:id)
  ...
```

So `where(author_id: some_author)` (passing a record where a scalar id is
expected) builds `author_id = <author.id>`.

trails' `PredicateBuilder#build`
(`packages/activerecord/src/relation/predicate-builder.ts:276`) has **no such
deref** at the top — it goes straight to null / Set / custom-handler / Range /
Array / Relation / basicObject dispatch:

```ts
build(attribute: Nodes.Attribute, value: unknown): Nodes.Node {
  if (value === null || value === undefined) return attribute.isNull();
  if (value instanceof Set) value = Array.from(value);
  const customHandler = ...;
  ...
  return this.basicObjectHandler.call(attribute, value);
}
```

The hash-expansion path already knows about this Rails behavior — there is a
comment at `predicate-builder.ts:178` describing `value = value.id if
value.respond_to?(:id)` and routing record values through
`AssociationQueryValue` — but the **scalar** `build(attribute, value)` entry
point does not apply it. A bare `where(col: record)` for a non-association
column therefore reaches `basicObjectHandler` with the record object instead of
its id, producing wrong SQL / a bind of the whole object rather than `record.id`.

## Acceptance criteria

- [ ] `build` dereferences an Active Record instance to its id at the top,
      mirroring `predicate_builder.rb:58` (`value = value.id if
    value.respond_to?(:id)` — in TS, "looks like an AR record / responds to
      `id`" → use `value.id`), before Set/Array/Range/Relation dispatch.
- [ ] No regression to the association/polymorphic hash-expansion path (which
      already coerces records via `AssociationQueryValue`); the deref must not
      double-handle records that path already resolves.
- [ ] Add a regression test: `where({ <scalar_col>: <record> })` builds
      `<scalar_col> = <record.id>`. Read the corresponding Rails
      `predicate_builder`/`relation/where` test and mirror its name verbatim.
- [ ] api:compare / test:compare delta non-negative.
