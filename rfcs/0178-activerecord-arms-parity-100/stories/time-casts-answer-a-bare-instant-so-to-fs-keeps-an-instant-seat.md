---
title: "activemodel: time casts answer a bare Temporal.Instant, so to_fs keeps an Instant seat and format_for_inspect a third clause"
status: closed
updated: 2026-10-10
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "FALSIFIED: trails#8742 dropped the Temporal.Instant to_fs seat and format_for_inspect's third clause with every activemodel type test and the activerecord inspect, cache-key and quoting tests green, so no cast reaches to_fs with a bare Instant. The range residue is filed as range-formats-db-keeps-a-helper-because-a-number-has-no-to-fs-seat."
---

## Context

Left by the PR that gave `to_fs` one receiver dispatch (story
`to-fs-has-no-receiver-dispatch-across-date-time-and-time-with-zone`): `Time#to_fs` is now Rails'
body on `RubyTime.prototype.toFs`, `Date#to_fs` and `DateTime#to_fs` are seated on ruby-compat's
`TEMPORAL_METHOD_TABLE`, and callers send `rbFSend(value, "toFs", format)`.

Three residues all come from a time cast still answering a bare `Temporal.Instant` where Rails
answers a `Time` (`packages/activemodel/src/type/helpers/time-value.ts:60-64`,
`packages/activemodel/src/type/time.ts:41`):

- `packages/activesupport/src/core-ext/time/conversions.ts` seats a `toFs` on the
  `Temporal.Instant` seat that bridges the Instant to a UTC `RubyTime`. Rails has no such receiver.
- `packages/activerecord/src/attribute-methods.ts` `formatForInspect` still tests
  `value instanceof Temporal.PlainDate || value instanceof RubyTime || value instanceof Temporal.Instant`
  where Rails tests `value.is_a?(Date) || value.is_a?(Time)`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods.rb:533`).
- `packages/activesupport/src/core-ext/range/conversions.ts` keeps a private `toFsDb` that tests
  for a `Temporal.PlainDate`, a JS `Date` and a `Temporal.Instant` where `RANGE_FORMATS[:db]`
  (`activesupport/lib/active_support/core_ext/range/conversions.rb:9-28`) calls
  `start.to_fs(:db)` / `stop.to_fs(:db)` on the receiver.

## Acceptance criteria

- [ ] Time casts answer a `RubyTime` (or a `TimeWithZone`), never a bare `Temporal.Instant`.
- [ ] The `Temporal.Instant` `toFs` seat in `core-ext/time/conversions.ts` is deleted.
- [ ] `formatForInspect`'s date/time test has two clauses, as `attribute_methods.rb:533`.
- [ ] `core-ext/range/conversions.ts` has no `toFsDb`; `RANGE_FORMATS.db` sends `toFs` to the
      receiver.
