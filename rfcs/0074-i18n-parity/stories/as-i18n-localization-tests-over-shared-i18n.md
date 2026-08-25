---
title: "as-i18n-localization-tests-over-shared-i18n"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps:
  - i18n-consolidate-activesupport-shim
deps-rfc: []
est-loc: null
priority: null
pr: 6035
claim: "2026-08-03T20:53:29Z"
assignee: "as-i18n-localization-tests-over-shared-i18n"
blocked-by: null
closed-reason: null
---

## Context

Second half of `as-i18n-localization-tests`, split out because it cannot land
until `i18n-consolidate-activesupport-shim` merges.

`vendor/rails/activesupport/test/i18n_test.rb:13-48` has nine localization
cases (`test_time_zone_localization_with_default_format`,
`test_date_localization_*`, `test_time_localization_*`) that assert
`I18n.localize(time)` against `time.strftime(...)`.

`packages/activesupport/src/i18n.test.ts` currently carries those nine cases
against the activesupport facade (`packages/activesupport/src/i18n.ts:428`
`localize`), which takes a JS `Date` and its own `strftime`, and whose
`type:` option is a trails invention with no Rails counterpart. Driving them
over `I18n::Backend::Base#localize` (`packages/i18n/src/backend/base.ts:168`)
and a `TimeWithZone` requires activesupport to import `I18n` from
`@blazetrails/i18n` — which is exactly the deliverable of
`i18n-consolidate-activesupport-shim` (claimed, unmerged as of 2026-08-03).
Rewriting the same nine cases in the same file before that lands would be a
direct file-overlap conflict with the sibling PR.

The duck-type half is already done: `TimeWithZone` answers `mon`
(`packages/activesupport/src/time-with-zone.ts`, mirroring the delegate list
at `vendor/rails/activesupport/lib/active_support/time_with_zone.rb:440`),
alongside the existing `wday`, `hour`, `sec` and `strftime`.

## Acceptance criteria

- The nine localization cases from `i18n_test.rb:13-48` in
  `packages/activesupport/src/i18n.test.ts` drive `I18n.localize` (the
  `@blazetrails/i18n` one) over a `TimeWithZone`, asserting against
  `strftime`, with their Rails names.
- No `type:` option remains in those cases; `format` is passed as a Ruby
  Symbol string (`":short"`, `":long"`, `":default"`).
