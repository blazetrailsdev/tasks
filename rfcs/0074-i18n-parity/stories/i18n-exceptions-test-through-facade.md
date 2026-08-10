---
title: "Converge exceptions.trails.test.ts onto i18n/exceptions_test.rb via the facade"
status: done
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6012
claim: "2026-08-03T19:46:42Z"
assignee: "i18n-exceptions-test-through-facade"
blocked-by: null
closed-reason: null
---

# Converge exceptions.trails.test.ts onto i18n/exceptions_test.rb

## Context

Three tests in `packages/i18n/src/exceptions.trails.test.ts` carry verbatim
Rails test names while asserting a different path than the Rails cases they are
named after, so `parity:test --package i18n` reports them as **misplaced**
(the only misplaced rows in the package after #6002):

- `InvalidPluralizationData stores entry, count and key`
- `MissingInterpolationArgument message contains the missing and given arguments`
- `ReservedInterpolationKey message contains the reserved key`

Rails builds each exception through a real lookup via the `force_*` helpers at
`vendor/i18n/test/i18n/exceptions_test.rb:80-95` — `force_invalid_pluralization_data`
calls `I18n.translate` with a `:count` the data can't satisfy,
`force_missing_interpolation_argument` interpolates a string missing an
argument, `force_reserved_interpolation_key` interpolates `%{scope}`. The trails
copies construct the exception objects directly (`new InvalidPluralizationData(...)`),
which asserts the constructor and message formatting but never exercises the
raise site.

The converged shape: these three belong in
`packages/i18n/src/exceptions.test.ts` (the convention target for
`i18n/exceptions_test.rb`), driven through `translate` / `interpolate`, which
the facade now exports — `packages/i18n/src/i18n.ts` — so the `force_*` helpers
port as local functions with the Rails names. `exceptions.trails.test.ts` keeps
only assertions with no Rails counterpart.

Same treatment applies to the other 7 cases of `i18n/exceptions_test.rb` still
measured as missing (`test_invalid_locale_stores_locale`, `passing an invalid
locale raises an InvalidLocale exception`, `MissingTranslationData exception
stores locale, key and options`, …) — all of them route through the same
`force_*` helpers.

## Acceptance criteria

- The `force_*` helpers port into `packages/i18n/src/exceptions.test.ts` under
  their Rails names, and the Rails-named cases live there driven through the
  facade.
- `parity:test --package i18n` reports 0 misplaced and
  `i18n/exceptions_test.rb` matched well above its current 2/12.
- `exceptions.trails.test.ts` retains only assertions with no Rails
  counterpart; no Rails-derived test is renamed.
