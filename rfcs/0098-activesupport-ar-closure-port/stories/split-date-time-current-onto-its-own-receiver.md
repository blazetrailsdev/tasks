---
title: "split-date-time-current-onto-its-own-receiver"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6549
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/time-ext.ts` has a single `current()` that stands in
for two distinct Rails class methods on two distinct receivers:

- `Time.current` — `::Time.zone ? ::Time.zone.now : ::Time.now`
  (`vendor/rails/activesupport/lib/active_support/core_ext/time/calculations.rb:39-41`)
- `DateTime.current` — `::Time.zone ? ::Time.zone.now.to_datetime : ::Time.now.to_datetime`
  (`vendor/rails/activesupport/lib/active_support/core_ext/date_time/calculations.rb:10-12`)

trails' `current` (`packages/activesupport/src/time-ext.ts:35-41`) returns the
`TimeWithZone` / JS `Date` arm only — the `Time.current` body. The `.to_datetime`
tail of the DateTime one has nowhere to go, because one TS function cannot return
both a Time and a DateTime. It is baselined as a homonym row in
`scripts/api-compare/call-mismatches-exclude/activesupport/time-ext.json`
(`rubyName: current`, `call: to_datetime`).

`core-ext/date/calculations.ts` already established the shape this needs: Rails
keeps `Date`, `Time` and `DateTime` as separate reopened receivers, and trails
gives each its own file keyed on its own TS type. There is a `core-ext/date/`
directory and a `time-ext.ts`, but no `core-ext/date-time/calculations.ts` — the
DateTime bodies were folded into `time-ext.ts` instead, which is what merged the
two `current`s. The date package already ports `Date#toDatetime` /
`DateTime#toDatetime` (`packages/date/src/date.ts:7463`), so the DateTime value
this needs exists.

Split out by the `converge-date-time-current-since-to-datetime` PR, which
converged the `compare_with_coercion` arm of the same call-gate sweep and left
this one because it is a receiver split rather than a one-line delegation.

## Acceptance criteria

- [ ] `DateTime.current` exists on its own receiver, with Rails' branch order,
      ending in `to_datetime` the way `date_time/calculations.rb:11` does.
- [ ] `time-ext.ts`'s `current` is `Time.current` only, and its JSDoc no longer
      claims to cover `DateTime.current`.
- [ ] The `current` → `to_datetime` row is deleted from
      `scripts/api-compare/call-mismatches-exclude/activesupport/time-ext.json`.
- [ ] `pnpm parity:api` and `pnpm parity:test` deltas non-negative.
