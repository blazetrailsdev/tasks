---
title: "activemodel: Date/DateTime cast_value pre-convert the DateTime seat because it answers no send"
status: done
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8413
claim: "2026-10-02T19:39:10Z"
assignee: "activemodel-cast-value-pre-converts-the-datetime-seat"
blocked-by: null
closed-reason: null
---

## Context

Left over from `activemodel-type-cast-value-normalises-js-date-seats-inline`, which decided that callers hand `cast_value` the Ruby seat: a JS `Date` and a `Temporal.Instant` are no longer converted inside `Date` / `DateTime` / `Time#castValue`, and `time.ts#castValue` is line for line. Two rows remain in `pnpm parity:api:arms:report --package=activemodel --direction=invented`, both for the one seat that IS a Ruby value and so cannot be converted by its caller, the `Temporal.PlainDateTime` / `Temporal.ZonedDateTime` that `DateTime.civil` returns:

- `packages/activemodel/src/type/date-time.ts#castValue`, `+if +if +if +if`. Rails (`vendor/rails/v8.0.2/activemodel/lib/active_model/type/date_time.rb:53-58`) hands a `::DateTime` to `apply_seconds_precision` and returns it. The port converts it to a `Time` first, in UTC or local by `is_utc?`.
- `packages/activemodel/src/type/date.ts#castValue`, `+if`. Rails (`type/date.rb:46-47`) reaches `DateTime#to_date` through `value.respond_to?(:to_date)`. The port has an `instanceof Temporal.PlainDateTime` arm calling `toPlainDate()`, because `rbObjRespondTo(value, "toDate")` answers false for that seat.

The blocker is the SEND, the same one `activemodel-time-value-user-input-in-time-zone-inlines-the-send` names. With the `date-time.ts` arm deleted, a `DateTime` passes through `cast_value` as Rails' does and reaches `TimeValue#serialize_cast_value` (`type/helpers/time_value.rb:11-23`), whose `value.utc?` / `value.getutc` / `value.getlocal` are method calls in the port (`packages/activemodel/src/type/helpers/time-value.ts`) and raise `TypeError: time.isUtc is not a function` on a Temporal value. ActiveSupport ports all three for the seat as free functions (`isUtc`, `getutc`, `getlocal` in `packages/activesupport/src/core-ext/date-time/calculations.ts`, Rails `core_ext/date_time/calculations.rb`), but nothing dispatches a send to them, and `rbFSend(value, "isUtc")` is not read as a call to `utc?` by `parity:api:calls`.

The Rails test that reaches it is `test_saves_both_date_and_time` (`vendor/rails/v8.0.2/activerecord/test/cases/date_time_test.rb`), ported in `packages/activerecord/src/date-time.test.ts`: it saves a `DateTime.civil(...)` with an offset.

## Acceptance criteria

- [ ] A `Temporal.PlainDateTime` / `Temporal.ZonedDateTime` answers `to_date`, `utc?`, `getutc` and `getlocal` where Rails sends them, with no `instanceof` at the call site.
- [ ] `date-time.ts#castValue` is Rails' two arms; `date.ts#castValue` is Rails' three.
- [ ] `saves both date and time` and `assign in local timezone` in `packages/activerecord/src/date-time.test.ts` stay green.
- [ ] `pnpm parity:api:arms:report --package=activemodel --direction=invented` shows no row for `type/date-time.ts#castValue` or `type/date.ts#castValue`.
