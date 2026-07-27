---
title: "counter-cache: destroy_row derives foreign keys trails-side instead of reading reflection.foreign_key"
status: ready
updated: 2026-07-27
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/counter-cache.ts` (`derivedForeignKey`, added by #5373)
exists only because trails' association reflections reaching
`CounterCache#destroy_row` can still be raw `AssociationDefinition` objects
(`{ type, name, options }`) with no derived `foreignKey`. Rails has no such
branch: `destroy_row` compares
`destroyed_by_association.foreign_key` against
`association.reflection.foreign_key`
(`vendor/rails/activerecord/lib/active_record/counter_cache.rb:210-224`), and every
reflection there is an `AssociationReflection` with a real `foreign_key`
(`reflection.rb`).

The `destroyedByAssociation` value is assigned from `this.reflection` in
`associations/has-many-association.ts:86` and
`associations/has-one-association.ts:232,681`.

A second, narrower divergence rides along: the derivation's last-resort branch
uses the _destroyed record's_ class name (`<record_class>_id`), whereas Rails'
`has_many` foreign key derives from the _owner's_ class name. It only bites a
`has_many` that neither names `foreignKey` explicitly nor uses `as:`.

## Acceptance criteria

- `destroyedByAssociation` (and `Association#reflection` on the paths
  `destroy_row` reads) carry a reflection with a real `foreignKey`, so both sides
  of the comparison are plain `.foreignKey` reads.
- `derivedForeignKey` is deleted from `counter-cache.ts`.
- `counter-cache.test.ts` (including "update other counters on parent destroy")
  and the dependent-destroy association suites stay green.
