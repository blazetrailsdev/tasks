---
title: "Restore ActiveSupport I18nTest localization cases over TimeWithZone"
status: closed
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6010
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by PR #6008 (i18n-consolidate-activesupport-shim), which ships TimeWithZone#mon and five of the nine localization cases over TimeWithZone; residual four date-localization cases refiled as as-i18n-date-localization-tests."
---

## Context

`vendor/rails/activesupport/test/i18n_test.rb:13-48` has nine localization
cases (`test_time_zone_localization_with_default_format`,
`test_date_localization_*`, `test_time_localization_*`) that assert
`I18n.localize(time)` against `time.strftime(...)`. They were dropped from
`packages/activesupport/src/i18n.test.ts` by
`i18n-consolidate-activesupport-shim`: the versions that existed there tested
the deleted activesupport facade's invented `type:` option, and
`I18n::Backend::Base#localize`
(`packages/i18n/src/backend/base.ts`) duck-types its argument on `strftime`,
`wday`, `mon`, `hour` and `sec` — a JS `Date` has none of them, and
`TimeWithZone` (`packages/activesupport/src/time-with-zone.ts`) has `wday`,
`hour`, `sec` and `strftime` but spells `mon` as `month`, so `%b` / `%B`
resolve against `undefined`.

## Acceptance criteria

- `TimeWithZone` answers the duck type `I18n::Backend::Base#localize` uses
  (`mon` alongside the existing `month`, matching Ruby's `Time#mon`).
- The nine localization cases from `i18n_test.rb` are ported into
  `packages/activesupport/src/i18n.test.ts` with their Rails names, driving
  `I18n.localize` over a `TimeWithZone` and asserting against `strftime`.
