---
title: "resolveOrderMatcher should not read the deprecated connection getter"
status: claimed
updated: 2026-06-22
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 40
pr: null
claim: "2026-06-22T16:43:56Z"
assignee: "resolve-order-matcher-without-connection-getter"
blocked-by: null
---

## Context

`Relation#order` resolution reads the **deprecated** `_modelClass.connection`
getter from `resolveOrderMatcher` (`relation/query-methods.ts:197`). Under
`permanent_connection_checkout = :deprecated | :disallowed` that getter
permanently leases a connection when it runs outside a `with_connection`
scope.

We have papered over this at every ordered-finder call site by wrapping the
`orderedRelation` + load in `_withQueryConnection`:

- `performFirst` — PR #3720
- `findNthWithLimit`, `findNthFromLast`, `performLast` — PR #3733 (this story,
  `finder-nth-with-connection-shim`)

These per-call-site shims are a workaround, not a convergence. Any future code
path that constructs an ordered relation outside a connection scope will
re-introduce the leak, and each one needs its own shim. Rails does not lease a
connection just to resolve an order matcher.

The root fix is to make `resolveOrderMatcher` resolve column/order information
without reading the deprecated `.connection` getter — e.g. read from
`schema_cache` (matching the `primary_key` convergence in PR #3564, see the
`with_connection preventPermanentCheckout shim` memory) — so the call-site
shims become unnecessary.

## Acceptance criteria

- [ ] `resolveOrderMatcher` (`relation/query-methods.ts`) no longer reads the
      deprecated `_modelClass.connection` getter; it sources whatever it needs
      (quoting / column resolution) from `schema_cache` or an equivalent
      non-leasing path.
- [ ] Ordered finders no longer require their `_withQueryConnection` wrappers
      solely to avoid the order-matcher leak; remove the now-redundant shims in
      `performFirst` / `findNthWithLimit` / `findNthFromLast` / `performLast`
      (or document why a wrapper is still needed for the load itself).
- [ ] `connection-handling.test.ts` "common APIs don't permanently hold a
      connection" stays green (it already covers `first` / `first(n)` /
      `second` / `secondToLast` / `last` / `last(n)`).
- [ ] Green on SQLite / PG / MySQL.
