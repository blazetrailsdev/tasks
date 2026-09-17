---
title: "assertions-activesupport-time-ext-date-port"
status: draft
updated: 2026-09-16
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
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

`assertions-activesupport-time-ext` (trails#7847) converged the part of
`vendor/rails/activesupport/test/core_ext/time_ext_test.rb` that the current
`@blazetrails/date` surface can express. The remaining rows need port work first:

- `advance gregorian proleptic` (:673-680): `Time#advance` does
  `to_date.gregorian.advance` (`core_ext/time/calculations.rb:205`), but
  `packages/date/src/time.ts` `toDate()` returns a `Temporal.PlainDate`, not a Ruby
  Date, so the `.gregorian` call is dropped in `core-ext/time/calculations.ts:197`.
- `sec fraction` / `floor` / `ceil` (:112-149): `Time#subsec` returns a Float, where
  Ruby's is a Rational. `Time#floor`/`#ceil` are unported.
- `advance` (:615-617): `Time.new(..., ActiveSupport::TimeZone["Moscow"])` ignores the zone.
- `at with in option` (:1191): `Time.at(31337, in: -28800)`.
- `change preserves fractional seconds on zoned time` (:528): `Time#inspect`.
- `to datetime` (:893): `DateTime#start`.
- `since with instance of time deprecated` (:285): the `rescue TypeError` deprecation arm of `since` (`calculations.rb:225-234`).

## Acceptance criteria

- `core_ext/time_ext_test.rb` reports 0 count/kind/value mismatches in
  `pnpm parity:test -- --assertions --package activesupport`.
- The mark file is FROZEN for this RFC by
  `scripts/test-compare/assertion-mismatch-mark.freeze`: do NOT run
  `pnpm parity:test:assertions:reseed` and do NOT hand-edit
  `assertion-mismatch-mark.json`. The gate stays green while the mark carries
  slack; `tighten-assertion-mark-after-0132` lowers it once at the end.
