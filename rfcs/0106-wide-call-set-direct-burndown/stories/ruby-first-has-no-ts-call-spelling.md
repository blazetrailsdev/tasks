---
title: "Ruby Array#first has no TS call spelling — compute_cache_version carries a @missingRailsCall tag for it"
status: done
updated: 2026-08-17
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6670
claim: "2026-08-17T21:28:00Z"
assignee: "converge-request-method-onto-methodoverride-original-method"
blocked-by: null
closed-reason: null
---

# Ruby `Array#first` has no TS call spelling

Direct sibling of the done [[ruby-empty-predicate-has-no-ts-call-spelling]]
(#6660), which added `activerecord/src/ruby-empty.ts` for exactly this class of
problem. Apply the same remedy to `first`.

## Context

Rails' `Relation#compute_cache_version` (`activerecord/lib/active_record/
relation.rb:509`) ends the unloaded branch with:

```ruby
size, timestamp = c.select_rows(arel, nil).first
```

`Array#first` is Ruby core. The faithful TS spelling is `rows[0]`, which is an
index read and emits no call, so the call-set gate (RFC 0047) has nothing to
credit and the row cannot converge. PR #6663 converged the other four
`compute_cache_version` rows (`quote_column_name`, `type_for_attribute`,
`to_fs`, and `empty?` once #6660 landed) but had to discharge this one with a
`@missingRailsCall first` tag at the call site rather than a real call, on
`computeCacheVersion`'s JSDoc in `packages/activerecord/src/relation.ts`.

That tag is a receipt, not a convergence. It is the only one left on that
method.

## Converged shape

Follow `ruby-empty.ts` exactly, including its placement rationale — the
call-set comparator resolves a Ruby call name against the PORTED names of the
package the call appears in, so the helper must live in `activerecord/src/`,
NOT in activesupport, or every Ruby `first` in an activesupport body becomes
resolvable and surfaces a pile of unrelated divergences at once:

```ts
/** Ruby `Array#first`. @internal */
export function first<T>(value: readonly T[]): T | undefined;
```

Then `rows[0]` becomes `first(rows)` and the `@missingRailsCall first` tag in
`relation.ts` is deleted (not reworded).

Check the receiver arms against Ruby before settling the signature: `first`
takes an optional count (`ary.first(2)` returns an Array), and Ruby's
`Enumerable#first` also answers on Hash and Range. Port only the arms trails
actually calls, the way `ruby-empty.ts` limited itself to its own receivers.

## Acceptance criteria

- [ ] `activerecord/src/ruby-first.ts` (or the equivalent agreed placement)
      exists with the `ruby-empty.ts` doc comment's placement rationale.
- [ ] `relation.ts`'s `computeCacheVersion` calls it; the
      `@missingRailsCall first` tag is DELETED.
- [ ] Sweep the other `first` rows the gate reports and converge the ones this
      unblocks; do not baseline any new ones.
- [ ] `pnpm parity:api:calls` green with a LOWER row count. No reseed.
