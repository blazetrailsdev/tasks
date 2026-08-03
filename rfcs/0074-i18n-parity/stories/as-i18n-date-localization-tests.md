---
title: "as-i18n-date-localization-tests"
status: done
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: ["i18n-consolidate-activesupport-shim"]
deps-rfc: []
est-loc: null
priority: null
pr: 6014
claim: "2026-08-03T20:07:43Z"
assignee: "as-i18n-date-localization-tests"
blocked-by: null
closed-reason: null
---

## Context

Residue of `as-i18n-localization-tests` after PR #6008
(`i18n-consolidate-activesupport-shim`) lands.

`vendor/rails/activesupport/test/i18n_test.rb:13-48` has nine localization
cases. PR #6008 ports five of them into
`packages/activesupport/src/i18n.test.ts` over `TimeWithZone` — the
`test_time_zone_localization_with_default_format` case and the four
`test_time_localization_*` cases — and also adds `TimeWithZone#mon`
(`vendor/rails/activesupport/lib/active_support/time_with_zone.rb:440`),
which is what `I18n::Backend::Base#localize`'s duck type needs
(`vendor/rails/i18n/lib/i18n/backend/base.rb:78-92`, `:292-299`;
ours at `packages/i18n/src/backend/base.ts:168`).

The four `test_date_localization_*` cases (`i18n_test.rb:18-32`) are NOT
covered by #6008 and are dropped from the file. They localize a bare Ruby
`Date` (`Date.parse("2008-7-2")`), which selects the `date.formats` scope
because it does not respond to `sec` (`base.rb:185` in our port). trails has
no `Date` analogue that answers the `strftime` / `wday` / `mon` duck type
without also answering `sec`, so restoring them needs that gap closed first
— not a `TimeWithZone`, which would resolve `time.formats` instead.

## Acceptance criteria

- The four `test_date_localization_*` cases from `i18n_test.rb:18-32` are
  restored in `packages/activesupport/src/i18n.test.ts` with their Rails
  names, driving `I18n.localize` over a date-only object that answers the
  `localize` duck type WITHOUT `sec`, asserting against `strftime`
  (`%Y-%m-%d`, `%b %d`, `%B %d, %Y`).
- `format` is passed as a Ruby Symbol string (`":default"`, `":short"`,
  `":long"`), never the retired `type:` option.
