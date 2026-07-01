---
title: "Relation#touchAll accepts time: keyword (Rails touch_all(*names, time:))"
status: ready
updated: 2026-07-01
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails `Relation#touch_all(*names, time: nil)` accepts an explicit `time:`
keyword, passed straight through to `touch_attributes_with_time(*names, time:)`
(vendor/rails/activerecord/lib/active_record/relation.rb:969-971).

trails' `Relation#touchAll(...names: string[])`
(packages/activerecord/src/relation.ts:4137) drops the `time:` keyword — it
always calls `touchAttributesWithTime.call(this._modelClass, ...names, undefined)`,
so the touched columns can only ever get the current time.

Surfaced while landing counter-cache-touch-time-hash-option (PR #4361): the
`touchAttributesWithTime` helper now accepts a trailing `time` (Rails
`(*names, time: nil)` shape), so wiring `time:` through `touchAll` is a small,
mechanical follow-up.

The port of Rails' `test_touch_all_with_given_time`
(vendor/rails/activerecord/test/cases/relation/update_all_test.rb:151-159, which
calls `Developer.where(name: "David").touch_all(:created_at, time: new_time)`)
currently works around the gap with `vi.useFakeTimers` instead of passing
`time:` — see packages/activerecord/src/relation/update-all.test.ts:253-267
("touch all with given time").

## Acceptance criteria

- `Relation#touchAll` accepts a `time:` argument matching Rails
  `touch_all(*names, time: nil)`, applying the given instant to the touched
  timestamp columns (delegating to `touchAttributesWithTime(*names, time)`).
- Restore update-all.test.ts "touch all with given time" to the literal Rails
  `touchAll("created_at", { time: newTime })` form, dropping the
  `vi.useFakeTimers` substitution.
