---
title: "converge-date-time-current-since-to-datetime"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6522
claim: "2026-08-14T14:43:25Z"
assignee: "converge-date-time-current-since-to-datetime"
blocked-by: null
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
