---
title: "i18n: port I18n::Tests::Interpolation and Link, and un-exclude the cascade/memoize/pluralization api suites"
status: ready
updated: 2026-11-22
rfc: "0000-i18n-surfaced-deviations"
cluster: null
packages:
  - "i18n"
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test --package i18n` (2026-11-22): 939/1094. Every `api/*_test.rb`
suite (`simple`, `chain`, `fallbacks`, `lazy_loadable`, `key_value`) misses the
same 31 tests: 24 `interpolation:` and 7 `linked lookup:`. They come from
`vendor/i18n/v1.14.8/lib/i18n/tests/interpolation.rb` (185 lines) and
`vendor/i18n/v1.14.8/lib/i18n/tests/link.rb` (66 lines), which each suite
`include`s (e.g. `vendor/i18n/v1.14.8/test/api/memoize_test.rb:6-7`).
`packages/i18n/test/support/tests/` has basics, defaults, lookup,
pluralization, procs and localization ported, but not these two.

Also, `scripts/parity/unported-files/i18n.ts` still excludes
`api/cascade_test.rb`, `api/memoize_test.rb` and `api/pluralization_test.rb`
as "Pre-1.0: optional backend mixin", but `packages/i18n/lib/backend/cascade.ts`,
`memoize.ts` and `pluralization.ts` are ported (the i18n-port-backend-\* stories
are done).

## Acceptance criteria

- Port `I18n::Tests::Interpolation` and `I18n::Tests::Link` to
  `packages/i18n/test/support/tests/interpolation.ts` / `link.ts`, and mount
  them in every api suite that includes them.
- Tests that depend on String encoding (euc-jp / `Encoding::CompatibilityError`,
  the ASCII/UTF8 rows) are parked `it.skip` under `PERMANENT-SKIP:` citing
  CLAUDE.md § "A String has no encoding tag either".
- Remove the three stale unported-files rows and port
  `api/cascade_test.rb`, `api/memoize_test.rb`, `api/pluralization_test.rb`
  with their full include lists.
- parity:test i18n delta is non-negative and the five api suites show 0 Miss.
