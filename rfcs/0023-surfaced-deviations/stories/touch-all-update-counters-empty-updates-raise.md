---
title: "touchAll/updateCounters must raise ArgumentError on empty updates, not return 0"
status: ready
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
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

Surfaced in review of PR #4862. That PR converged `touchAll`/`updateCounters` by
DELETING their non-Rails `none?` guards, so both now inherit `return 0 if @none`
from `updateAll` exactly as Rails does (relation.rb:592). One deviation on the
same methods was left in place, because changing it is an observable behavior
change beyond that PR's seed-rebase scope:

Both still early-return 0 when the computed update hash is empty:

- `touchAll` — relation.ts:3894 `if (Object.keys(updates).length === 0) return 0;`
- `updateCounters` — the equivalent guard before its `return this.updateAll(updates)`

Rails has no such guard. `touch_all` (relation.rb:969-971) is a bare
`update_all model.touch_attributes_with_time(*names, time: time)`, and
`update_counters` (relation.rb:926-944) ends in `update_all updates`. An empty
hash therefore reaches `update_all`, whose FIRST line is
`raise ArgumentError, "Empty list of attributes to change" if updates.blank?`
(relation.rb:589) — note this precedes the `@none` check, so it raises even on a
`none` relation.

Observable divergence:

```ts
// Model with NO timestamp columns (touch_attributes_with_time => {}):
Model.none().touchAll(); // Rails: raises ArgumentError
// trails: returns 0
Model.all().touchAll(); // same divergence
```

## Acceptance criteria

- [ ] `touchAll` / `updateCounters` drop their empty-updates early-return and let
      `updateAll` raise `ArgumentError("Empty list of attributes to change")`,
      matching relation.rb:589.
- [ ] Confirm the blank-check-precedes-none? ordering holds: a `none` relation
      with empty updates RAISES rather than returning 0.
- [ ] Check `updateCounters({}, { touch: [] })` — the existing comment claims the
      guard exists to "skip updateAll, which would" misbehave; verify against
      Rails whether that call should raise, and port the real Rails behavior.
- [ ] Tests mirroring Rails' touch_all / update_counters coverage
      (vendor/rails/activerecord/test/cases/relations_test.rb,
      vendor/rails/activerecord/test/cases/counter_cache_test.rb).
