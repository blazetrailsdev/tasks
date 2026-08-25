---
title: "performLast's reverse-order arm uses orderedRelation/reverseOrder, dropping orderByPk and hasReversibleOrder"
status: done
updated: 2026-08-16
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6599
claim: "2026-08-16T15:15:06Z"
assignee: "collection-proxy-delegate-query-method-bangs-to-scope"
blocked-by: null
closed-reason: null
---

## Context

With the `_isEmptyRelation()` guard gone (PR #6596), the remaining divergence in
`performLast` is its reverse-order arm. Rails
(`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:204-208`):

```ruby
result = ordered_relation.limit(limit)
result = result.reverse_order!
limit ? result.reverse : result.first
```

trails (`packages/activerecord/src/relation/finder-methods.ts`, `performLast`)
instead branches on a trails-only `hasReversibleOrder(this)` helper and, when
false, builds `orderByPk(this, "desc")` — a second trails-only helper — rather
than calling `orderedRelation()` (which already exists in the same file and is
the faithful port of `ordered_relation`) and then `reverseOrder()`. It also
calls `toArray()` where Rails calls `.first` on the reversed relation.

`hasReversibleOrder` / `orderByPk` are extra surface Rails does not have; the
`_rawOrderClauses` concern they encode (`inOrderOf` SQL that cannot be reversed)
needs to be handled where `reverseOrder` handles it, not by a caller-side branch
in the finder.

## Converged shape

- `performLast` becomes `orderedRelation.call(this)` → `.limit(n)` →
  `.reverseOrder()` → `n !== undefined ? records.reverse() : first`, matching
  `:204-208` line for line.
- `hasReversibleOrder` and `orderByPk` are deleted from `finder-methods.ts`.
- Any `_rawOrderClauses` irreversibility is resolved inside `reverseOrder()`,
  where Rails' `reverse_order!` owns it.

## Acceptance criteria

- [ ] `performLast`'s query arm matches `finder_methods.rb:204-208`.
- [ ] `hasReversibleOrder` and `orderByPk` no longer exist.
- [ ] `last` / `last(n)` on ordered, unordered, `inOrderOf` and composite-PK
      relations stay green on SQLite, PostgreSQL and MySQL/MariaDB.
