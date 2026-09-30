---
title: "activerecord: score the SKIP_GROUPS[0] names activerecord defines (freeze, to_ary, nil?, initialize_clone, then)"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: skips
packages: ["activerecord"]
deps: ["arel-score-core-object-names-nil-and-case-then", "activerecord-port-promise"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SKIP_GROUPS[0]` hides 13 activerecord definitions (it is not marked PERMANENT):

- `Core#freeze` (`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb`), `Result#freeze` (`vendor/rails/v8.0.2/activerecord/lib/active_record/result.rb`)
- `Core#to_ary` (returns `nil` so `Array(record)` does not splat), `Relation#to_ary`
  (`records`), `Result#to_ary`
- `Relation::QueryAttribute#nil?` (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/query_attribute.rb`)
- `Inheritance::ClassMethods#initialize_clone` (`vendor/rails/v8.0.2/activerecord/lib/active_record/inheritance.rb`)
- `Relation#then`, `FutureResult#then`, `Promise#then`, `Promise#class`

`then` on Relation is ratified (CLAUDE.md § "`Relation` is evaluated by an async query" — `applyThenable`),
and `Promise#then`/`#class` belong to `activerecord-port-promise`. The rest translate directly: a Ruby
`to_ary` is `toAry()` (JS never calls a method by that name), `nil?` is `isNil`
(`arel-score-core-object-names-nil-and-case-then` adds the mapping), `freeze` is `Object.freeze` plus
Rails' body.

## Acceptance criteria

- [ ] `freeze`, `to_ary`, `nil?`, `initialize_clone` are scored for activerecord and ported with Rails' bodies.
- [ ] `then` stays skipped only through a scoped, CLAUDE.md-cited entry for `relation.rb` / `future_result.rb` (and `promise.rb` if its port lands the same shape).
- [ ] `pnpm parity:api` activerecord global skip falls by the scored names.
