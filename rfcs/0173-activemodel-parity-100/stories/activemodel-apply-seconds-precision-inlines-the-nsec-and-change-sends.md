---
title: "activemodel: TimeValue#apply_seconds_precision inlines every seat's nsec and change instead of sending them"
status: draft
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
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

Surfaced by trails#8413, which gave ruby-compat a `TEMPORAL_METHOD_TABLE` (`packages/ruby-compat/src/object.ts`): methods bound on a Temporal seat, answered by `rbObjRespondTo` and dispatched by `rbFSend`. `TimeValue#serialize_cast_value` and `Date#cast_value` now send through it. `apply_seconds_precision` in the same file does not.

Rails (`vendor/rails/v8.0.2/activemodel/lib/active_model/type/helpers/time_value.rb:24-36`):

    def apply_seconds_precision(value)
      return value unless precision && value.respond_to?(:nsec)

      number_of_insignificant_digits = 9 - precision
      round_power = 10**number_of_insignificant_digits
      rounded_off_nsec = value.nsec % round_power

      if rounded_off_nsec > 0
        value.change(nsec: value.nsec - rounded_off_nsec)
      else
        value
      end
    end

`packages/activemodel/src/type/helpers/time-value.ts#applySecondsPrecision` stands three file-private functions in for the sends: `respondToNsec` (a six-way `instanceof` chain), `nsec` and `changeNsec` (each an `instanceof` ladder over `Time`, `TimeWithZone`, `Temporal.Instant`, `PlainDateTime`, `ZonedDateTime` and `PlainTime`). ActiveSupport already ports `DateTime#nsec` (`packages/activesupport/src/core-ext/date-time/conversions.ts`) and `DateTime#change` (`core-ext/date-time/calculations.ts`).

`Temporal.Instant` is not a Ruby seat since trails#8413 (callers hand `cast_value` a `Time`), so its arms can go rather than move.

## Acceptance criteria

- [ ] `applySecondsPrecision` is `rbObjRespondTo(value, "nsec")`, `rbFSend(value, "nsec")` and `rbFSend(value, "change", { nsec })`, with ActiveSupport's `DateTime#nsec` / `#change` assigned on `TEMPORAL_METHOD_TABLE`.
- [ ] `respondToNsec`, `nsec` and `changeNsec` are deleted.
- [ ] `pnpm parity:api:arms:report --package=activemodel` shows no row for `type/helpers/time-value.ts#applySecondsPrecision`, in either direction or in the short-circuit table.
