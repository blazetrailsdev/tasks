---
title: "tzinfo-stand-in-becomes-its-own-package"
status: draft
updated: 2026-10-25
rfc: "0207-fugit-gem-family-port"
cluster: null
packages: []
deps:
  - port-et-orbi-package
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The TZInfo 2 stand-in (`Timezone`, `TimezonePeriod`, `TimezoneOffset`,
`ConstantOffsetDataTimezoneInfo`, `AmbiguousTime`, `PeriodNotFound`,
`InvalidTimezoneIdentifier`, the tzdata 2026c `TZDB_NAMES` list, the Intl
helpers, and the `TZInfo` namespace object) lives in
`packages/activesupport/src/values/time-zone.ts`. TZInfo is a gem, so it belongs
in its own `@blazetrails/tzinfo` package, as i18n, thor and chronic do.

Because et-orbi reaches the stand-in through `@blazetrails/activesupport`,
loading et-orbi installs ActiveSupport's `Time#<=>` (`compare_with_coercion`,
`packages/activesupport/src/core-ext/time/calculations.ts:310`), which answers
nil for an `EtOrbi::EoTime` through `DateTime#<=>` / `rb_num_coerce_cmp`. The
et-orbi spec runs without ActiveSupport, where `Time#<=>` is MRI's `time_cmp`
(`vendor/ruby/v3.3.11/time.c:3951`), whose non-Time arm is `rb_invcmp`
(`vendor/ruby/v3.3.11/compar.c:50`), and `Time#==` is `cmp_equal`
(`compar.c:79`). So `vendor/et-orbi/v1.2.11/spec/eo_time_spec.rb:781`
("Time == EoTime > returns true when same sec") is parked as `it.skip` in
`packages/et-orbi/src/eo-time.test.ts`, pointing at this story.

et-orbi's only other activesupport read is `TopLevel.Trails` in
`packages/et-orbi/src/info.ts` (`Rails::VERSION::STRING rescue nil`,
`et-orbi.rb:36`), which can become `registeredConstant("Rails")`.

## Acceptance criteria

- [ ] `packages/tzinfo/` holds the stand-in; activesupport imports `Timezone`
      and friends from it, and `TimeZone` stays in activesupport.
- [ ] Decide and record whether tzinfo 2.x is vendored and compared, or the
      package is not API-compared.
- [ ] `@blazetrails/et-orbi` no longer depends on `@blazetrails/activesupport`.
- [ ] `@blazetrails/date` `Time#compare` hands a non-Time to `rb_invcmp`, and
      `Time` gains `equals` as `Comparable#==` (`cmp_equal`).
- [ ] The parked "Time == EoTime > returns true when same sec" test is unparked
      and passes.
