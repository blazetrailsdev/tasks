---
title: "travel_to stubs real clock methods instead of a module-state holder; wire after_teardown"
status: done
updated: 2026-08-13
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6468
claim: "2026-08-13T15:19:07Z"
assignee: "merge-clauses-where-clause-structure"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Testing::TimeHelpers#travel_to`
(activesupport/lib/active_support/testing/time_helpers.rb:168-190) stubs four
singleton methods through `SimpleStubs`: `Time.now`, `Time.new`, `Date.today`
and `DateTime.now`. Production code reading any of them sees the traveled time.

trails' port (`packages/activesupport/src/testing/time-helpers.ts`, #6454) ports
`SimpleStubs` faithfully but has only one stub target: a module-local `clock`
holder, because trails production code reads the clock through
`time-travel.ts`'s module state (`currentTimeInstant`), which a property stub
cannot reach. `stubObject` therefore also pushes into that module state — two
mechanisms where Rails has one. Three call-mismatch baseline rows record the
related gaps (`travel_to` → `at`, `parse`, `to_time`) in
`scripts/api-compare/call-mismatches-exclude/activesupport/testing/time-helpers.json`.

`TimeHelpers#after_teardown` (time_helpers.rb:70-73) is ported and exported but
wired into no test-case base, so travel does not auto-unwind after a test the way
Rails' `super` chain guarantees.

## Converged shape

- Make `@blazetrails/date`'s `Time.now` / `Date.today` (and the trails clock
  seam) genuinely stubbable so `SimpleStubs` is the single mechanism and the
  baseline rows can be deleted.
- Wire `afterTeardown` into the AR suite's shared harness
  (`packages/activerecord/src/cases/helper.ts`), the helper.rb port.

## Acceptance criteria

- `travelTo` stubs named clock methods rather than writing module state.
- The three `time-helpers.json` baseline rows are deleted.
- Travel unwinds automatically at teardown in the AR suite.
