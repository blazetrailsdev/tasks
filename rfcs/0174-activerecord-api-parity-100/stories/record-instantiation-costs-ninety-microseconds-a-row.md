---
title: "activerecord: instantiating a loaded row costs ~90 µs whatever is selected"
status: in-progress
updated: 2026-10-04
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#8472
claim: "2026-10-04T01:39:23Z"
assignee: "record-instantiation-costs-ninety-microseconds-a-row"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trailmap#31 (trails pin `9e17ddc98d`). Loading 11,531 `Story` rows from SQLite costs
1.0-1.2 s, about 90 µs a row, and the cost does not depend on how many columns are selected:

- `Story.all().toArray()`: 1.00-1.18 s
- `Story.select("id", "rfc_id", "status").toArray()`: 1.01-1.30 s
- `Story.pluck("rfc_id", "status")`: 5-7 ms

So the time is in building the record (`Base._instantiate`, `packages/activerecord/src/base.ts:1637`,
and what it calls: `allocate`, `initWithAttributes`, the attribute set), not in the query or the
adapter. trails#8428 and trails#8433 removed two causes; this is what is left. Rails instantiates a
row in a few microseconds (`vendor/rails/v8.0.2/activerecord/lib/active_record/persistence.rb:313`
`instantiate_instance_of`: `klass.allocate.init_with_attributes(attributes)`), because
`LazyAttributeSet` defers every cast.

The application workaround, which is the finding: trailmap's RFC list stopped loading records and
plucks two columns; `/backlog` and `/stories.json` still pay it (2.4-2.8 s).

Related: `column-defaults-is-not-memoized`, `initialize-callbacks-are-suppressed-by-mutating-the-class`,
`rb-obj-dup-copies-ivars-through-property-descriptors`.

## Expected shape

Profile one `_instantiate` and account for the 90 µs; a three-column select should cost visibly
less than a full row, and a full row an order of magnitude less than today.

## Acceptance criteria

- [ ] A CPU profile of loading 10,000 rows is attached, with the top costs named.
- [ ] Loading 10,000 rows of a 20-column model takes under 200 ms on the same machine, or the remaining cost is filed against its cause.
