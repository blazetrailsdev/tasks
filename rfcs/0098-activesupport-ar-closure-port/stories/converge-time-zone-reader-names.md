---
title: "converge-time-zone-reader-names"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6514
claim: "2026-08-14T12:27:03Z"
assignee: "converge-time-zone-reader-names"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api --package activesupport` reports `core_ext/time/zones.rb` at
2 missing members: `zone` and `zone_default`.

Both ARE implemented, under trails-invented names in
`packages/activesupport/src/time-zone-config.ts`:

- `getZone()` (time-zone-config.ts:27) is Rails' `Time.zone`
  (`vendor/rails/activesupport/lib/active_support/core_ext/time/zones.rb:14-16`)
- `getZoneDefault()` (time-zone-config.ts:59) is Rails' `Time.zone_default`
  (`core_ext/time/zones.rb:10`, `attr_accessor :zone_default`)

Per `docs/ruby-ts-conventions.md` a Ruby reader `zone` maps to TS `zone`, so
the `get`-prefixed spellings are the bug — `parity:api` is matching on the
Rails name and finding nothing. The writers (`setZone`, `setZoneDefault`) are
already correct under the settled `setX()` idiom for async/awaitable setters
and should NOT be renamed.

Split out of the `time-with-zone-and-duration-residue` bundle (PR for RFC 0098) because it is a purely mechanical cross-package rename with **63 call
sites in 4 packages** — activesupport, activemodel, activerecord, plus tests:

    packages/activemodel/src/type/helpers/timezone.ts
    packages/activemodel/src/type/time.ts
    packages/activemodel/src/type/helpers/time-value.ts
    packages/activerecord/src/attribute-methods/time-zone-conversion.ts
    packages/activerecord/src/cases/helper.ts
    packages/activerecord/src/test-helper.ts
    packages/activerecord/src/test-helper.test.ts
    packages/activerecord/src/dirty.test.ts
    packages/activesupport/src/time-zone-config.ts
    packages/activesupport/src/time-with-zone.ts
    packages/activesupport/src/time-ext.ts
    packages/activesupport/src/index.ts
    packages/activesupport/src/core-ext/date/calculations.ts
    packages/activesupport/src/core-ext/time-with-zone.test.ts

Folding it into the port PR would have buried ~63 mechanical touch points in a
diff that is already over the LOC ceiling by agreement.

Also worth converging in the same pass: `dateInTimeZone`
(time-zone-config.ts:126) is extra surface with no Ruby counterpart — Rails
reaches `Date#in_time_zone` through `DateAndTime::Zones#in_time_zone`
(`core_ext/date_and_time/zones.rb:20-29`), which the port PR adds as
`packages/activesupport/src/core-ext/date-and-time/zones.ts`. Once that lands,
`dateInTimeZone`'s callers should move onto it and the helper should go.

## Acceptance criteria

- `getZone` renamed to `zone`, `getZoneDefault` renamed to `zoneDefault`,
  all 63 call sites updated; `setZone` / `setZoneDefault` left alone.
- `core_ext/time/zones.rb` reports 0 missing in `pnpm parity:api`.
- `dateInTimeZone` removed and its callers routed through
  `core-ext/date-and-time/zones.ts`'s `inTimeZone`, or a note in the PR body
  explaining why that half is deferred.
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative;
  `pnpm parity:api:extra --package activesupport` does not grow.
