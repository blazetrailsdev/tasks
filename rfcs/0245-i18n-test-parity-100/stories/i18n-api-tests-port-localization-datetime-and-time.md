---
title: "i18n: port I18n::Tests::Localization::DateTime and ::Time into the api suites"
status: claimed
updated: 2026-11-19
rfc: "0245-i18n-test-parity-100"
cluster: api-mixins
packages: [i18n]
deps: [i18n-api-tests-port-procs-and-localization]
deps-rfc: []
est-loc: 550
priority: null
pr: null
claim: "2026-11-19T12:46:31Z"
assignee: "i18n-api-tests-port-localization-datetime-and-time"
blocked-by: null
closed-reason: null
---

## Context

Split out of `i18n-api-tests-port-procs-and-localization` (RFC 0156), which
asked for a further split if it went over the ceiling. That story ports
`Tests::Procs` and `Tests::Localization::Date`, along with `Localization::Date`'s
`setup` / `setup_date_translations`
(`vendor/i18n/v1.14.8/lib/i18n/tests/localization/date.rb:7-11`, `:104-122`).
DateTime and Time define their own `setup_*_translations` at the foot of
each file.

- `vendor/i18n/v1.14.8/lib/i18n/tests/localization/date_time.rb` has 17 tests (`:14-84`), on
  `::DateTime.new(2008, 3, 1, 6)` (`:10-11`).
- `vendor/i18n/v1.14.8/lib/i18n/tests/localization/time.rb` has 16 tests (`:14-85`), on
  `::Time.utc(2008, 3, 1, 6, 0)` (`:10-11`).
- Both are mounted by `vendor/i18n/v1.14.8/test/api/{chain,fallbacks,key_value,simple}_test.rb`.
- trails: `Base#localize` (`packages/i18n/lib/backend/base.ts:288-312`) and the
  `Localizable` duck type (`:151-157`). DateTime comes from `@blazetrails/date`.
  Time is whatever `localizable()` accepts for Ruby `Time`. Read that before
  you pick the fixture value.

## Acceptance criteria

- [ ] `testsLocalizationDateTime()` / `testsLocalizationTime()` in
      `packages/i18n/test/support/tests/localization/`, under the Rails test
      names, and added to `REQUIRED_TEST_MODULES` in
      `scripts/test-compare/extract-ts-core.ts`.
- [ ] Mounted in `packages/i18n/test/api/{chain,fallbacks,key-value,simple}.test.ts`.
- [ ] A failing test is fixed in `packages/i18n/lib`, not renamed or skipped.
- [ ] `pnpm parity:test -- --package i18n` shows 33 more OK per mount, and
      `pnpm parity:test:assertions` stays green.
