---
title: "Replace the RubyDate test stand-ins with a real date-only analogue"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already done: both RubyDate stand-ins are gone — activesupport/src/i18n.test.ts:5 and i18n/src/backend/localization.test.ts:14 now import the real Date from @blazetrails/date."
---

## Context

PR #6014 restored the four `test_date_localization_*` cases from
`vendor/rails/activesupport/test/i18n_test.rb:18-32`. Rails localizes a bare
Ruby `Date` (`Date.parse("2008-7-2")`), which `I18n::Backend::Base#localize`
duck-types: it answers `strftime`, `wday` and `mon` but NOT `sec`, and that
absence is what selects the `date.formats` scope over `time.formats`
(`vendor/rails/i18n/lib/i18n/backend/base.rb:78-92`; ours at
`packages/i18n/src/backend/base.ts:254-262`).

trails has no `Date` analogue that answers that duck type — `TimeWithZone`
answers `sec` and would resolve `time.formats`. So the test defines a local
`RubyDate` stand-in in `packages/activesupport/src/i18n.test.ts`, and a second
copy of the same stand-in already exists in
`packages/i18n/src/backend/localization.test.ts`. Two hand-rolled
`strftime`/`wday`/`mon` implementations in test files stand in for a type the
port is missing.

## Acceptance criteria

- trails grows a date-only analogue of Ruby's `::Date` that answers the
  `localize` duck type (`strftime`, `wday`, `mon`, no `sec`), placed at the
  Rails-matched location for the core-ext it belongs to.
- Both `RubyDate` stand-ins are deleted and their tests drive the real type:
  `packages/activesupport/src/i18n.test.ts` and
  `packages/i18n/src/backend/localization.test.ts`.
- No test-name changes; the restored Rails test names stay verbatim.
