---
title: "assertions-activesupport-string-ext-multibyte-safe-buffer"
status: in-progress
updated: 2026-09-17
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: trails#7855
claim: "2026-09-17T15:46:52Z"
assignee: "assertions-activesupport-logging-tail"
blocked-by: null
closed-reason: null
---

## Context

Split from `assertions-activesupport-string-and-multibyte` (RFC 0132), whose PR
converged `inflector_test.rb`, `transliterate_test.rb`, `core_ext/regexp_ext_test.rb`
and `core_ext/symbol_ext_test.rb` and hit the 700-LOC ceiling. Remaining files,
as measured before that PR (`pnpm parity:test -- --assertions --package activesupport`):

| Rails test file               | count | kind | value |
| ----------------------------- | ----: | ---: | ----: |
| `core_ext/string_ext_test.rb` |    61 |   86 |    19 |
| `multibyte_chars_test.rb`     |    50 |   55 |     4 |
| `safe_buffer_test.rb`         |     7 |   19 |     6 |

Notes from the first slice:

- `vendor/rails/activesupport/test/core_ext/string_ext_test.rb` reads its tables
  (`CamelToUnderscore`, `StringToParameterized*`, `UnderscoreToHuman*`, …) from
  `vendor/rails/activesupport/test/inflector_test_cases.rb`. trails currently
  declares a subset of those tables inline in
  `packages/activesupport/src/inflector.test.ts`; extract them to a shared
  `inflector-test-cases.ts` (mirroring `constantize-test-cases.ts`) and add the
  `PreserveCase` / `NoSeparator` tables string_ext_test needs.
- `String#camelize` is now ported at `core-ext/string/inflections.ts`
  (`core_ext/string/inflections.rb`); the other `String` inflection wrappers
  there are still unported, and string-ext.test.ts calls the Inflector functions
  directly.
- Ruby `frozen?` on a String has no primitive analogue (a JS string primitive is
  always `Object.isFrozen`); the inflector slice asserted on `Object(x)`.

## Acceptance criteria

- The three files above report 0 assertion-count, 0 assertion-kind and 0
  assertion-value mismatches in `pnpm parity:test -- --assertions --package activesupport`.
- The mark file is FROZEN for this RFC by
  `scripts/test-compare/assertion-mismatch-mark.freeze`: do NOT run
  `pnpm parity:test:assertions:reseed` and do NOT hand-edit
  `assertion-mismatch-mark.json`. The gate stays green while the mark carries
  slack; `tighten-assertion-mark-after-0132` lowers it once at the end.
- No test name changes; `pnpm parity:test` percent for activesupport does not drop.

## LOC limit

**The per-PR LOC limit is LIFTED for RFC 0132.** Stories here may ship as large
a PR as the work honestly needs; do not split a file's burndown, restructure a
test, or leave a remainder unconverged merely to fit a line budget. Every other
constraint (no test renames, mark file only-shrink, no name-gate regression)
still applies.
