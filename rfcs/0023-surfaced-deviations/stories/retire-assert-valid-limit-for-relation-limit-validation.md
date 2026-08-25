---
title: "Delete CollectionProxy's assertValidLimit; validate limits at Rails' limit!/sanitize_limit site"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already converged: assertValidLimit no longer exists anywhere in packages/ or scripts/; findNthWithLimit and findTakeWithLimit (finder-methods.ts:590, :1113) both end in relation.limit(limit), inheriting the single limit!/sanitize_limit validation site as Rails does (finder_methods.rb:590, 603-615)."
---

## Context

`packages/activerecord/src/associations/collection-proxy.ts` carries a
trails-only helper, with the deviation already admitted in its own JSDoc:

```ts
/**
 * Validate a numeric limit (safe non-negative integer) and raise the
 * same error shape as Relation#limitBang. Rails' `first(n)` / `last(n)`
 * / `take(n)` all route through `limit(limit)` which validates; our
 * TS finder methods bypass validation for first/take via
 * `_limitValue = n` (a TS-internal shortcut that diverges from Rails).
 * For Rails fidelity at the CollectionProxy layer we validate all three.
 */
function assertValidLimit(n: number): void { ... }
```

Rails has no such function. `first(n)` / `take(n)` reach
`find_nth_with_limit` / `find_take_with_limit`, which call `limit(limit)`
(`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:590`,
`:603-615`), and `LIMIT` validation lives once in
`QueryMethods#limit!` → `sanitize_limit`
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb`, `limit!`).
So in Rails there is exactly one validation site and the finders inherit it.

trails' finder helpers assign `_limitValue = n` directly instead of going
through `limit()`, so the validation never runs — and `CollectionProxy`
compensates by calling `assertValidLimit(n)` at the top of `first`, `last` and
`take`. Those three calls are now the ONLY reason those three overrides keep a
body beyond `load_target if find_from_target?; super`: PR #6592 collapsed
everything else, and `take()` in particular is currently
`assertValidLimit(n)` + the two Rails lines.

This is also an invented-surface row: `assertValidLimit` has no Ruby
counterpart.

## Converged shape

Route the finder helpers' limit application through `limit()` / `limitBang()`
so `sanitize_limit`-equivalent validation happens once, at the Rails site,
instead of being re-asserted at the `CollectionProxy` layer. Then delete
`assertValidLimit` and its three call sites, letting
`CollectionProxy#take` / `#last` become literally
`load_target if find_from_target?; super` and `#first` disappear (see the
sibling `_isEmptyRelation` story, which removes the other blocker for `first`).

The error class and message must stay whatever `Relation#limitBang` raises
today, so the existing invalid-limit tests keep passing unchanged.

## Acceptance criteria

- [ ] `assertValidLimit` is deleted from `collection-proxy.ts`.
- [ ] Invalid limits raise from the `limit()`/`limitBang()` path, with the same
      error class and message as today.
- [ ] `CollectionProxy#take` and `#last` carry no body beyond
      `load_target if find_from_target?; super`.
- [ ] Association and relation finder tests stay green on SQLite, PostgreSQL
      and MySQL/MariaDB.
