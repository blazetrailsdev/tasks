---
title: "ordered finders (first(n)/second/last) leak connection under deprecated permanent checkout"
status: done
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 3733
claim: "2026-06-20T18:13:28Z"
assignee: "finder-nth-with-connection-shim"
blocked-by: null
---

## Context

While fixing PR #3720, `performFirst` (`Relation#first`) was found to leak a
connection under `permanent_connection_checkout = :deprecated | :disallowed`:
routing through `orderedRelation` calls `order(...)`, whose
`resolveOrderMatcher` (`relation/query-methods.ts:197`) reads the deprecated
`_modelClass.connection` getter. That read ran outside any `with_connection`
scope, permanently leasing a connection. PR #3720 fixed `performFirst` by
wrapping the ordering+load in `_withQueryConnection`.

The same pattern remains in `findNthWithLimit` and `findNthFromLast`
(`relation/finder-methods.ts:431,451`): both call `orderedRelation(this)`
before `toArray()`, outside the connection shim. These back `first(n)`,
`second`, `third`, `last`, etc., so those finders would leak a connection
under deprecated/disallowed permanent checkout. Not currently exercised by
`connection-handling.test.ts` (which only tests bare `first()`).

## Acceptance criteria

- [ ] `findNthWithLimit` / `findNthFromLast` run their `orderedRelation` +
      load inside `_withQueryConnection` (matching `performFirst`).
- [ ] Extend `connection-handling.test.ts` "common APIs don't permanently hold
      a connection" to cover `first(n)` / `second` / `last`.
- [ ] Green on SQLite/PG/MySQL.
