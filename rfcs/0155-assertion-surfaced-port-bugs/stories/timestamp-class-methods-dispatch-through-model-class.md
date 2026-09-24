---
title: "Timestamp ClassMethods *_in_model are not dispatched through the model class"
status: draft
updated: 2026-09-24
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `model-cannot-override-timestamp-attributes-for-update` (trails#8028).
That PR made `timestampAttributesForCreateInModel` / `timestampAttributesForUpdateInModel`
dispatch the raw `timestampAttributesFor{Create,Update}` through the receiver
class, and seated those two on `Base` via `extend`. The rest of
`ActiveRecord::Timestamp::ClassMethods` (`activerecord/lib/active_record/timestamp.rb:54-100`)
is still not on the class, so its self-calls are still direct module-function calls:

- `touch_attributes_with_time` (`timestamp.rb:55-61`) calls
  `timestamp_attributes_for_update_in_model` on self; trails'
  `touchAttributesWithTime` (`packages/activerecord/src/timestamp.ts`) calls
  `timestampAttributesForUpdateInModel.call(this)`.
- `all_timestamp_attributes_in_model` (`timestamp.rb:74-77`) calls the two
  `*_in_model` on self; trails calls the module functions.
- `timestamp_attributes_for_create_in_model`, `timestamp_attributes_for_update_in_model`,
  `all_timestamp_attributes_in_model` and `current_time_from_proper_timezone`
  (`timestamp.rb:64-81`) are public class methods in Rails, but `Base` does not carry them.
  Callers reach them as `Timestamp.x.call(klass)`: `insert-all.ts`,
  `touch-later.ts` (Rails `touch_later.rb:14` calls `self.class.timestamp_attributes_for_update_in_model`),
  `persistence.ts`, plus instance-side calls in `timestamp.ts`
  (`timestamp.rb:103-160` call `self.class.all_timestamp_attributes_in_model` etc).

So a model override of any `*_in_model` method is still never consulted.

## Converged shape

`extend(Base, { timestampAttributesForCreateInModel, timestampAttributesForUpdateInModel,
allTimestampAttributesInModel, currentTimeFromProperTimezone })` beside the
existing `touchAttributesWithTime` extend in `base.ts`, with `declare static`s.
Every internal caller then dispatches through the class (`this.x()` inside
ClassMethods, `klass.x()` / `this.constructor.x()` at the call sites), matching Rails' self-calls.

## Acceptance criteria

- The four public ClassMethods are class methods on `Base`, and every trails call site dispatches through the model class.
- `touchAttributesWithTime` and `allTimestampAttributesInModel` call the `*InModel` methods on `this`.
- A regression test overrides `timestampAttributesForUpdateInModel` on a canonical-table model and asserts `touch` honours it. The test fails on the baseline.
- `parity:api:calls`, `parity:api:calls:args` and `parity:api:extra:gate` stay green.
