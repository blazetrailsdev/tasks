---
title: "belongs_to touch: afterTouch callbacks not called on in-memory parent instance"
status: done
updated: 2026-06-29
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 4269
claim: "2026-06-29T13:10:11Z"
assignee: "belongs-to-touch-fires-after-touch-on-parent"
blocked-by: null
---

## Context

`vendor/rails/activerecord/test/cases/associations/belongs_to_associations_test.rb:738` — `test_belongs_to_counter_after_touch`: when a `belongs_to` with `touch: true` fires, Rails calls `after_touch` callbacks on the in-memory parent instance (incrementing `topic.after_touch_called` from 0 → 1 → 2). In trails, the touch runs as a SQL UPDATE but the parent object's `afterTouch` callbacks are never invoked on the in-memory instance. Surfaced in PR #4209 (test marked `.todo`).

Trails source: counter-cache touch path in `packages/activerecord/src/associations/belongs-to-association.ts` — the `touchRecord` / counter-cache update runs SQL but doesn't call `runCallbacks("touch")` on the parent's in-memory instance.

## Acceptance criteria

- After a `belongs_to` touch fires on record create/destroy, the parent record's `afterTouch` callbacks are called on the in-memory parent instance.
- `belongs to counter after touch` in `belongs-to-associations.test.ts` passes (un-todo).
