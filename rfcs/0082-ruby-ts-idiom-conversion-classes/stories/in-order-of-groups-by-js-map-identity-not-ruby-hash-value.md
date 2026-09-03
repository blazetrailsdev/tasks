---
title: "inOrderOf groups by JS Map identity where Ruby's Hash keys an Array by value, so a tuple series matches nothing"
status: draft
updated: 2026-09-03
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `find` onto `find_with_ids` in PR #7447.

Ruby's `in_order_of` is `group_by(&key).values_at(*series).flatten(1).compact`
(`activesupport/lib/active_support/core_ext/enumerable.rb:197-203`). `group_by`
builds a Hash, and **a Ruby Hash keys an Array by value** — `{[1,2] => x}[[1,2]]`
finds `x`.

trails' `inOrderOf` (`packages/activesupport/src/enumerable-utils.ts:235-252`)
ports that literally, through `groupBy` / `valuesAt`, which are backed by a JS
`Map`. **A JS `Map` keys by identity**, so a series entry that is an array never
matches the grouped key built from a different but equal array. The filtering
arm then drops every element and returns `[]`.

This is not hypothetical: `find_some_ordered` is
`result.in_order_of(:id, ids.map { ... })` (`finder_methods.rb:576`), and for a
composite primary key `record.id` and each `ids` entry are both tuples. Routing
composite `find` through `find_some_ordered` — which is what Rails does, and
what #7447 converged trails to do — returned `[]` until the call site was made
to stringify both sides:

```ts
const keyOf = (id: unknown): unknown => (composite ? String(id) : id);
```

That `keyOf` is a workaround living at the wrong level. It sits in
`packages/activerecord/src/relation/finder-methods.ts:650-656`, where Rails has
nothing, and it only fixes the one caller that happened to hit the bug. Every
other `inOrderOf` caller with a non-scalar key is silently wrong.

## Converged shape

Give `groupBy` / `valuesAt` (and through them `inOrderOf`) Ruby's Hash key
semantics for non-scalar keys, so `inOrderOf(records, r => r.id, tuples)`
matches by value the way `enumerable.rb:199` does. The natural spelling is a
value-keyed lookup (a canonical string or structural key computed inside
`groupBy`), applied on both the grouping and the `valuesAt` side so they agree.

Then delete `keyOf` from `find_some_ordered` and restore the Rails body:

```ts
return inOrderOf(
  result,
  (record: any) => record.id,
  ids.map((id) => (this.model as any).typeForAttribute(String(pk)).cast(id)),
);
```

## Acceptance criteria

- `inOrderOf` with array-valued keys matches by value, not identity; covered by
  a test that fails on the current implementation.
- Other `groupBy` / `valuesAt` callers are checked for a behaviour change and
  either keep working or are converged with it.
- `keyOf` is gone from `relation/finder-methods.ts` and `find_some_ordered` is
  Rails' body verbatim; the composite-PK `find` tests in `finder.test.ts` stay
  green on every adapter lane.
