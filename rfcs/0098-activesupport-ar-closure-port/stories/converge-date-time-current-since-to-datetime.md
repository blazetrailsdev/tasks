---
title: "converge-date-time-current-since-to-datetime"
status: blocked
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-14T13:47:03Z"
assignee: "converge-date-time-current-since-to-datetime"
blocked-by: "Blocked on unmerged PR #6518 (core-ext-sweep-hash-module-string-residue), which is what introduces `toDatetime` (String#to_datetime) into activesupport's call-parity population AND adds all three baseline rows this story is asked to delete. On origin/main (2ed11c25d) none of the three rows exist: scripts/api-compare/call-mismatches-exclude/activesupport/core-ext/date/calculations.json is absent entirely and time-ext.json has no to_datetime rows. Acceptance criterion 2 (delete the rows, tighten the marks) is unsatisfiable until #6518 lands, and touching those two shards now guarantees a rebase conflict on exactly the baseline JSON that must never be resolved by taking a side.\n\nTwo of the three sites also need re-specifying before the story is actionable; the story's Rails citations are wrong:\n\n- `since`: the story cites date_time/calculations.rb:85-88, but that range is `DateTime#advance`. `DateTime#since` is date_time/calculations.rb:116-118 and is `self + Rational(seconds, 86400)` — no `to_datetime` at all. The only `to_datetime` under the name `since` is Time#since's `rescue TypeError` arm (time/calculations.rb:225-234), which exists solely to deprecate passing a non-numeric and is documented to raise TypeError in Rails 8.1. trails' `since(date, seconds: number)` cannot reach it, and time-ext.json already carries the sibling row for that same arm's `warn` call with that reason. So this is the existing unrepresentable-arm class, not a convergence.\n\n- `current`: `DateTime.current` (date_time/calculations.rb:10-12) does end in `.to_datetime`, but `Time.current` (time/calculations.rb:39-41) does not, and trails has ONE `current()` in time-ext.ts serving both Ruby methods. One function cannot return both a Time and a DateTime, so this is the same homonym class as the already-baselined `sec_fraction`/`subsec` pair in this shard. Converging it means splitting `current` into separate Time and DateTime receivers — a different, larger story than the one written.\n\n- `compare_with_coercion` (date/calculations.rb:152-158) IS genuinely convergeable: core-ext/date/calculations.ts:245 inlines `date.toZonedDateTime(\"UTC\").toInstant()` under a local named `toDatetime`, which is exactly Date#to_datetime. But the port that exists is `Date#toDatetime` on the @blazetrails/date `Date` class (packages/date/src/date.ts:7463), whose receiver is that class, not the `Temporal.PlainDate` this file is keyed on; there is no PlainDate-receiver `to_datetime` to call, and adding one here is new public surface in a Rails-matched file that date/calculations.rb does not define. Needs a decision on where a PlainDate `to_datetime` lives before it can be written.\n\nUnblock: after #6518 merges, re-scope to the compare_with_coercion arm plus a decision on the PlainDate to_datetime home, and re-file the current/since arms as homonym/unrepresentable rows rather than convergences."
closed-reason: null
---

## Context

`String#to_datetime` landed in `packages/activesupport/src/time-ext.ts` as
`toDatetime` (the `core-ext-sweep-hash-module-string-residue` PR). That put the
name `to_datetime` in the activesupport call-parity population and surfaced
three pre-existing bodies that omit a `to_datetime` Rails makes. All three are
baselined now and are real gaps, not homonyms:

- `time-ext.ts` `current` — Rails' `DateTime.current` is
  `::Time.zone ? ::Time.zone.now.to_datetime : ::Time.now.to_datetime`
  (`vendor/rails/activesupport/lib/active_support/core_ext/date_time/calculations.rb:10-12`);
  trails returns the `TimeWithZone`/`Date` arm only
  (`packages/activesupport/src/time-ext.ts:38-44`).
- `time-ext.ts` `since` — `DateTime#since` ends in `.to_datetime`
  (`date_time/calculations.rb:85-88`).
- `core-ext/date/calculations.ts` `compare_with_coercion` — Rails coerces the
  receiver with `to_datetime` before comparing against a Time
  (`vendor/rails/activesupport/lib/active_support/core_ext/date/calculations.rb:140-146`).

Rows live in `scripts/api-compare/call-mismatches-exclude/activesupport/time-ext.json`
and `.../core-ext/date/calculations.json`.

## Acceptance criteria

- [ ] Each of the three bodies routes through `toDatetime` where Rails routes
      through `to_datetime`, with Rails' branch order preserved.
- [ ] The three `to_datetime` rows are deleted from their baseline shards and
      the stale high-water marks tightened with `pnpm parity:api:calls:tighten`.
- [ ] `pnpm parity:api` delta non-negative.
