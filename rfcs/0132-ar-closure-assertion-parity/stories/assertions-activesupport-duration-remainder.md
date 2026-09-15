---
title: "assertions-activesupport-duration-remainder"
status: draft
updated: 2026-09-15
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

Split from `assertions-activesupport-time-datetime-duration`, which converged
most of `core_ext/duration_test.rb` (and ported `Duration::Scalar#+ - * / %`
onto `activesupport/lib/active_support/duration.rb:41-110`) but hit the LOC
ceiling. Remaining `pnpm parity:test -- --assertions --missing --package activesupport`
rows for `core_ext/duration_test.rb` (trails `packages/activesupport/src/core-ext/duration.test.ts`):

- `scalar plus` / `scalar minus` / `scalar multiply` / `scalar divide` / `scalar modulo`
  (`duration_test.rb:462-580`) — Scalar source already converged; only the test
  bodies need porting (value + instanceOf pairs, `assertRaises([TypeError])` +
  message "no implicit conversion of String into ActiveSupport::Duration::Scalar").
- `before and after without argument` (`:325-330`) and
  `since and ago anchored to time now when time zone is not set` (`:283-296`) —
  port with `vi.useFakeTimers` / `vi.setSystemTime` as `Time.stub(:now)`.
- `since and ago anchored to time zone now when time zone is set` (`:298-315`) —
  `Duration#since` without an argument anchors on `Temporal.Now.instant()`
  instead of `Time.current` (`duration.rb` `sum` uses `Time.current`), so it
  never returns a TimeWithZone; needs the source converged first.
- `respond to` (`:396-399`) — `assert_respond_to 1.day, :zero?` depends on
  Duration's `method_missing` delegation to `value`.
- `inspect` (`:107`) — `(1.day / 24).inspect` is "3600 seconds" only because of
  Ruby Integer division; the assertion is omitted with a call-site comment.

## Acceptance criteria

- `core_ext/duration_test.rb` reports 0 count/kind/value mismatches, or each
  remaining one carries a call-site comment naming the language gap.
- `scripts/test-compare/assertion-mismatch-mark.json` lowered by exactly this story's contribution.
- No test name changes.

## LOC limit

**The per-PR LOC limit is LIFTED for RFC 0132.** Stories here may ship as large
a PR as the work honestly needs; do not split a file's burndown, restructure a
test, or leave a remainder unconverged merely to fit a line budget. Every other
constraint (no test renames, mark file only-shrink, no name-gate regression)
still applies.
