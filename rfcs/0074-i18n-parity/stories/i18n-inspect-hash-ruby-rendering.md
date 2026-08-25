---
title: "Render Hash inspect Ruby-style in I18n error messages"
status: done
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6022
claim: "2026-08-03T21:02:08Z"
assignee: "i18n-inspect-hash-ruby-rendering"
blocked-by: null
closed-reason: null
---

## Context

`inspect` in `packages/i18n/src/exceptions.ts:14` renders a Hash JS-style —
`{first: "Masao"}` — where Ruby's `Hash#inspect` renders `{:first=>"Masao"}`
(symbol keys, `=>` separator). It stands in for Ruby `#inspect` throughout
`exceptions.ts`, so the divergence is baked into every I18n error message:
`MissingInterpolationArgument` (`vendor/i18n/lib/i18n/exceptions.rb:44`),
`MissingTranslation`, and the default
`missing_interpolation_argument_handler`.

Surfaced while porting `vendor/i18n/test/i18n/interpolate_test.rb:88` in #6013:
the gem asserts the custom handler produces
`values are {:first=>"Masao"}`, and the ported case had to spell its
expectation through `inspect(...)` rather than the gem's literal string.

Note `inspectSymbol` (`exceptions.ts:28`) already renders a Symbol as
`:first`, so the key half of the rule exists — it is not applied to Hash keys.

## Acceptance criteria

- `inspect` renders a plain object as Ruby's `Hash#inspect` does:
  `{:first=>"Masao"}` for string (Symbol-analogue) keys.
- `interpolate.test.ts`'s
  "String interpolation can use custom missing interpolation handler" asserts
  the gem's literal expected string rather than routing through `inspect`.
- Error-message expectations across `exceptions.test.ts` /
  `backend/exceptions.test.ts` updated to the Ruby rendering; `parity:test
--package i18n` non-negative.
