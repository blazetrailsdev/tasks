---
title: "CollectionProxy does not delegate _select! to scope"
status: claimed
updated: 2026-08-20
rfc: "0114-collection-proxy-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-08-20T10:52:33Z"
assignee: "delegate-select-bang-to-scope"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging the delegate list in #6755
(`collection-proxy-delegate-leftjoins-without-fix`).

Rails builds `CollectionProxy`'s delegate-to-scope list by reflection
(`vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb:1128-1137`):

```ruby
delegate_methods = [QueryMethods, SpawnMethods].flat_map { |klass|
  klass.public_instance_methods(false)
} - self.public_instance_methods(false) - [:select] + [...]
delegate(*delegate_methods, to: :scope)
```

The subtraction is `- [:select]` — **only** the non-bang reader.
`QueryMethods#_select!` (`query_methods.rb:428`, `def _select!(*fields) # :nodoc:`)
is a public instance method and is _not_ subtracted, so Rails delegates it to
`scope`.

trails' hand-written stand-in list in
`packages/activerecord/src/associations/collection-proxy.ts`
(`QUERY_METHODS_PUBLIC_INSTANCE_METHODS`) carries neither spelling: #6755
removed the bogus `selectBang` entry (no such Rails or trails method), and the
real member — `_selectBang`, exported from
`packages/activerecord/src/relation/query-methods.ts:611,2676` — was never in
the list. So `CollectionProxy#_selectBang` resolves against `Relation.prototype`
and mutates the proxy's own relation state instead of the association scope,
where Rails routes it at `scope`.

This is the last known name-level gap between trails' hand-list and Rails'
computed one; #6755 closed the `left_joins` / `without` half and the three
phantom-name half.

## Converged shape

`_selectBang` joins the bang half of `QUERY_METHODS_PUBLIC_INSTANCE_METHODS`,
next to `reselectBang`, so `delegateMethods` routes it at `scope()` like every
other `QueryMethods` bang builder. The `name !== "select"` filter stays exactly
as Rails' `- [:select]` — it must not be widened to also strip `_selectBang`.

Note this is likely absorbed for free by
`derive-collection-proxy-delegate-list-from-mixin-keys` (and its bakeoff
siblings), which derive the list from `Object.keys(QueryMethodBangs)` — that key
set contains `_selectBang`. If that story lands first, verify the derived list
includes it and close this one as absorbed; the parent story's byte-identical
acceptance criteria are what kept it out so far.

## Acceptance criteria

- `CollectionProxy#_selectBang` delegates to `scope()`.
- The `- [:select]` filter still strips only the non-bang `select`, matching
  `collection_proxy.rb:1130`.
- Regression coverage in
  `packages/activerecord/src/associations/collection-proxy-delegation.trails.test.ts`,
  whose existing structural assertions already pin the delegate set.
- `pnpm parity:api:calls` / `:args` add zero rows.
