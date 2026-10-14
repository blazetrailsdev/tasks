---
title: "activerecord: Relation#groupBy answers a Map where Enumerable#group_by answers a Hash"
status: ready
updated: 2026-10-14
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
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
