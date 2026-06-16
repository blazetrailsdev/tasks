---
title: "Relation#first applies implicit PK order on non-loaded path (match find_nth_with_limit)"
status: ready
updated: 2026-06-16
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

While porting `loaded-relation-first-no-requery` (PR #3499) I found a separate,
pre-existing Rails deviation in the **non-loaded** path of `performFirst`
(`packages/activerecord/src/relation/finder-methods.ts:331-339`).

Rails' `Relation#first` routes through `find_nth_with_limit`
(`activerecord/lib/active_record/relation/finder_methods.rb`), whose non-loaded
branch builds `ordered_relation` — applying the implicit PK order — before
`.limit(n)`. Our `performFirst` non-loaded path instead just `_clone()`s, sets
`_limitValue = 1` (or `n`), and runs `toArray()` with **no implicit ordering**.
So our `.first` emits `LIMIT 1` while Rails emits `ORDER BY <pk> ASC LIMIT 1`.

Note the inconsistency: our `performSecond`/`performThird`/etc. already go
through `findNthWithLimit` (which calls `orderedRelation`), so they order by PK —
only `first` skips it. The faithful fix is to route `performFirst` through the
existing `findNthWithLimit(0, n)` helper (no-arg → `findNthWithLimit(0,1)[0]`),
which already handles the loaded? branch too.

This was deliberately left out of PR #3499 to keep that change scoped to the
loaded short-circuit — the ORDER BY change is wider and may shift `.first` SQL
across many existing tests, so it needs its own PR + regression sweep.

## Acceptance criteria

- [ ] `performFirst` non-loaded path applies implicit PK ordering, matching
      Rails `first` → `find_nth_with_limit` → `ordered_relation` (emit
      `ORDER BY <pk> ASC LIMIT n`).
- [ ] Prefer reusing the existing `findNthWithLimit` helper rather than
      duplicating the ordered_relation/limit_value/offset_value logic.
- [ ] No regression in finder-methods or relation SQL-shape tests; update any
      tests that assert the old un-ordered `.first` SQL to match Rails.
