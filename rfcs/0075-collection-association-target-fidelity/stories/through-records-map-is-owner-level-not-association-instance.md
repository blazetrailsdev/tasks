---
title: "@through_records is owner-level state in trails, per-association-instance in Rails"
status: draft
updated: 2026-08-29
rfc: "0075-collection-association-target-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `HasManyThroughAssociation`'s constructor parameter
name in PR #7190 (`param-drift-activerecord-associations`, RFC 0128): the TS
constructor is a bare `super(owner, reflection)` pass-through
(`packages/activerecord/src/associations/has-many-through-association.ts:21-23`)
where Rails' does work.

Rails
(`vendor/rails/activerecord/lib/active_record/associations/has_many_through_association.rb:9-12`):

```ruby
def initialize(owner, reflection)
  super
  @through_records = {}.compare_by_identity
end
```

`@through_records` is per-ASSOCIATION-INSTANCE state, seeded at construction and
read/written at `has_many_through_association.rb:57` (`@through_records[record] ||=`),
`:87` and `:221` (`@through_records.delete(record)`), via `through_records_for`
(`:199`) and `delete_through_records` (`:209-221`).

trails parks it on the OWNER instead, keyed by reflection name
(`has-many-through-association.ts:386-396`):

```ts
function throughRecordsCache(assoc: HasManyThroughAssociation): Map<Base, Base> {
  const owner = assoc.owner as unknown as {
    _throughRecordsCaches?: Map<string, Map<Base, Base>>;
  };
  const store = (owner._throughRecordsCaches ??= new Map<string, Map<Base, Base>>());
  ...
}
```

Same lookups in the common case — an association instance is per owner+name —
but the lifetime differs: Rails' map dies with the association object, so a
fresh association for the same owner+name starts empty, while trails' owner-level
map outlives association reset/reload and hands the new instance the old
through-records. `compare_by_identity` is a JS `Map`'s default key semantics, so
that half already matches.

Consumers to move with it: `throughRecordsCache` call sites at
`has-many-through-association.ts:317`, `:381`, `:460`, and `throughRecordsFor`
(`:427`).

## Converged shape

Hold the map as an instance field on `HasManyThroughAssociation`, assigned in the
constructor after `super(owner, reflection)` — mirroring `has_many_through_association.rb:11`
— and drop `owner._throughRecordsCaches` and the `throughRecordsCache` helper
that reaches for it. That also gives the constructor the body Rails gives it,
rather than a pass-through that exists only to name its parameters.

## Acceptance criteria

- The through-records map is per-association-instance state seeded in the
  constructor, not owner-level state keyed by reflection name.
- `owner._throughRecordsCaches` is gone; no state for it survives an association
  reset.
- `pnpm parity:api:extra --package activerecord` loses the `throughRecordsCache`
  helper rather than gaining surface; `parity:api:calls` and
  `parity:api:calls:args` add no row.
- The has-many-through suites stay green on all three adapters.
