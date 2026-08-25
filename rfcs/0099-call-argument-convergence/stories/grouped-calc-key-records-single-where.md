---
title: "Grouped calculation's key-record lookup is one where call for both PK arities"
status: done
updated: 2026-08-13
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6495
claim: "2026-08-13T21:57:10Z"
assignee: "converge-fixtures-encrypted-attributes-present"
blocked-by: null
closed-reason: null
---

## Context

PR #6477 folded the composite-key belongs_to arm back into the single
`execute_grouped_calculation` body
(`packages/activerecord/src/relation/calculations.ts`), matching
activerecord/lib/active_record/relation/calculations.rb:514-595. One arity
branch survives the fold, inside the `if (association)` arm:

```ts
const keyRecords =
  primaryKey.length === 1
    ? await klass.where({ [primaryKey[0]]: keyIds.map((vals) => vals[0]) }).toArray()
    : await klass.where(primaryKey, keyIds).toArray();
```

Rails writes ONE call for both arities (calculations.rb:562-563):

```ruby
key_records = association.klass.base_class.where(association.klass.base_class.primary_key => key_ids)
```

The Ruby hash form takes an Array primary key as the KEY (`["a","b"] => [[1,2]]`,
the composite-key where form) and a String key for the scalar case, so one
expression covers both. TypeScript object literals cannot carry an array key, so
the composite arm is spelled as the two-argument `where(keys, values)` overload
and the scalar arm keeps the object form — the branch is a spelling artifact,
not a semantic one.

Related: the same arm keys its lookup Map by a NUL-joined tuple string, because
JS `Map` keys compare by reference where Ruby's `Hash` compares Arrays by value,
and reads each PK column via `_readAttribute` because the composite-PK `id`
accessor returns an array. Those two are genuine language shortcomings; the
`where` split may not be.

## Converged shape

Reduce the two `where` calls to one. The likely route is a `where` overload
accepting `string | string[]` as the hash KEY position (a `Map`-shaped or
tuple-keyed argument), so the ported line reads as Rails' single
`where(primary_key => key_ids)` for both arities. Check `Relation#where`'s
existing composite-key entry points before adding surface — if one already
accepts the array-key form, this is a call-site change only.

## Acceptance criteria

- [ ] One `where` call in the association arm, no `primaryKey.length` branch.
- [ ] No new public surface without a Rails counterpart.
- [ ] `calculations.test.ts`, `grouped-composite-assoc-*.trails.test.ts` and
      `cpk-eager-count-aggregate-build-joins-fold.trails.test.ts` stay green.
