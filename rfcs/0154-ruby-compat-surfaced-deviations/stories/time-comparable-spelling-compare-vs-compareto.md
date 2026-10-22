---
title: "Time spells <=> as compare, so ruby-compat Comparable operators throw on it"
status: draft
updated: 2026-10-22
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby `Time` includes `Comparable` and defines `<=>` (`time_cmp`, `vendor/ruby/v3.3.11/time.c:3951`), so `time > other` is `Comparable#>` (`cmp_gt`, `vendor/ruby/v3.3.11/compar.c`). In trails, `@blazetrails/date`'s `Time` spells `<=>` as `compare` (`packages/date/src/time.ts:1539`), while `Date` (`packages/date/src/date.ts:4234`) and `TimeWithZone` (`packages/activesupport/src/time-with-zone.ts:691`) spell it `compareTo`. ruby-compat's `Comparable` operators (`greaterThan` and the others, through `cmpint`, `packages/ruby-compat/src/comparable.ts:273`) call `this.compareTo`, so calling `greaterThan` on a `Time` throws `TypeError: this.compareTo is not a function`.

This surfaced in trails#9218: `TestAdapter#filtered_time?` (`vendor/rails/v8.0.2/activejob/lib/active_job/queue_adapters/test_adapter.rb:61-63`, `job.scheduled_at > at`) crashed. The call site was switched to `rbCmpint(cmp(a, b), a, b) > 0`, which works because `cmp` special-cases a `compare`-spelled Time.

## Acceptance criteria

- [ ] `Time` answers ruby-compat's `Comparable` protocol: one `<=>` spelling across `Time`, `Date` and `TimeWithZone`, chosen by `docs/ruby-ts-conventions.md`, so `greaterThan.call(time, other)` works.
- [ ] The `Time` special case in `cmp` (`comparable.ts`, the `rbObjClassname(a) === "Time"` arm) is removed if it becomes redundant.
- [ ] A regression test calls `Comparable#>` on a `@blazetrails/date` `Time`.
