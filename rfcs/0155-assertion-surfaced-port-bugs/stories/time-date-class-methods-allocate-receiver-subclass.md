---
title: "time-date-class-methods-allocate-receiver-subclass"
status: blocked
updated: 2026-09-16
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 2
pr: null
claim: "2026-09-16T13:48:25Z"
assignee: "globalid-locator-single-argument-deprecation"
blocked-by: "Date.today/.jd and DateTime.now/.jd (packages/date/src/date.ts:4628,4704,5914,6229) return Temporal.PlainDate/PlainDateTime, not Date/DateTime instances, so no receiver subclass can be allocated until those class methods return Date objects"
closed-reason: null
---

## Context

`vendor/rails/activesupport/test/time_travel_test.rb` `test_time_helper_travel_with_time_subclass`
asserts `TimeSubclass.now.class == TimeSubclass` (also `Date.today`, `DateTime.now`), inside and
outside `travel`. In trails it is `it.skip` in `packages/activesupport/src/time-travel.test.ts`:
`packages/date/src/time.ts` `Time.now` / `Time.at` build through `Time.#atInstant` (hard-coded
`Time`, private static so `this` cannot reach it from a subclass), so a subclass receiver
allocates the base class. `Date.today` / `DateTime.now` / `.jd` (`packages/date/src/date.ts`)
likewise. Ruby's `time_s_now` / `time_s_at` allocate `klass` (`vendor/ruby/time.c`).
The travel stubs in `testing/time-helpers.ts` already dispatch on `this` (`time_helpers.rb:179-191`).

## Acceptance criteria

- `Time`/`Date`/`DateTime` class constructors (`now`, `at`, `today`, `jd`) allocate the receiver class.
- Unskip `time helper travel with time subclass` with Rails' 9 assertions.

## LOC limit

**The per-PR LOC limit is LIFTED for RFC 0132.** Stories here may ship as large
a PR as the work honestly needs; do not split a file's burndown, restructure a
test, or leave a remainder unconverged merely to fit a line budget. Every other
constraint (no test renames, mark file only-shrink, no name-gate regression)
still applies.
