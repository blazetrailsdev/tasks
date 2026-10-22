---
title: "activerecord: Relation#groupBy answers a Map where Enumerable#group_by answers a Hash"
status: ready
updated: 2026-10-18
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages:
  - "activerecord"
  - "ruby-compat"
deps: []
deps-rfc: []
est-loc: 80
priority: 53
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Relation#groupBy` (`packages/activerecord/src/relation.ts`,
`ENUMERABLE_DELEGATES.groupBy`) calls ActiveSupport's `groupBy`
(`packages/activesupport/src/enumerable-utils.ts`), which answers a JS `Map`.

Rails' Relation has no `group_by` of its own: it is `Enumerable#group_by`
through `include Enumerable`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb:67`), which
answers a Hash (`enum_group_by`, `vendor/ruby/v3.3.11/enum.c:1157`).

trails#8854 moved Relation's other Enumerable members (`partition`, `isAll`,
`eachCons`, `eachWithIndex`, `toSet`, `collect`, `detect`, `reject`, `sortBy`)
onto ruby-compat's Array methods and added `groupBy` to ruby-compat's
`Enumerable` module (`packages/ruby-compat/src/enumerable.ts`). `groupBy` was
left on the ActiveSupport helper because the return type is public
(`Promise<Map<K, T[]>>`) and callers read it as a `Map`
(`packages/activerecord/src/relation.trails.test.ts`, "groupBy").

## Acceptance criteria

- [ ] `Relation#groupBy` answers what `rbFSend(records, "groupBy", block)`
      answers (ruby-compat's `Enumerable.groupBy` over the loaded records), a
      `Hash` as Ruby's is.
- [ ] Callers and tests reading the result as a `Map` are updated.
- [ ] `ENUMERABLE_DELEGATES` no longer imports ActiveSupport's `groupBy`.

## Audit 2026-10-22

Still present: `async groupBy<K>(fn): Promise<Map<K, T[]>>` at `relation.ts:637`.
The direct shape is a call to ruby-compat's `Enumerable` `groupBy` over the loaded records,
not an `rbFSend` with a literal name (root CLAUDE.md § "A dispatch by name is spelled directly").
