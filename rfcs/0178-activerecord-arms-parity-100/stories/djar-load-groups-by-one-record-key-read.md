---
title: "activerecord: DisableJoinsAssociationRelation#load groups by record[key] with no composite arm"
status: closed
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-10-08T17:05:11Z"
assignee: "pg-gem-connection-surface-scores-against-the-pg-gem"
blocked-by: null
closed-reason: "RFC 0178 refine 2026-10-09: moves no parity needle. The story's own body says the Array.isArray arm is invisible to the arms report (absorbed by the compact! lowering) and can carry no receipt, and its blocker found Rails 8.0.2 has no composite record[key] read to converge onto. No row in arms (either direction), returns or duck-types on main @ 9d5fb25bbf."
---

## Context

`DisableJoinsAssociationRelation#load` (`packages/activerecord/src/disable-joins-association-relation.ts`) groups the
loaded records by
`Array.isArray(key) ? key.map((column) => record.get(column)) : record.get(key)`.
Rails groups by `record[key]` alone
(`vendor/rails/v8.0.2/activerecord/lib/active_record/disable_joins_association_relation.rb:28-30`). The
`Array.isArray` arm is one Rails does not take.

The arm is invisible to the arms report: Rails' `records.compact!` (`:33`) lowers to an optional `if`
(`scripts/api-compare/enumerable-idioms.ts`, the `compact!` row), and that lowering absorbs it. So no
`@inventedArm` receipt can sit on it either; one would read stale.

It exists because `Base#[]` (`get`, `attribute-methods.ts:630`) reads one attribute, and a composite `key` is an
Array (`DisableJoinsAssociationScope#last_scope_chain`,
`associations/disable_joins_association_scope.rb:22-34`, hands `reflection.join_primary_key` through).
`associations/disable-joins-composite-key.trails.test.ts` covers the composite path.

## Acceptance criteria

- [ ] Establish what Rails' `record[key]` answers for an Array `key` (run it under `ruby` against a composite-key
      model) and record the result here.
- [ ] `load` groups by one `record.get(key)` call, as `disable_joins_association_relation.rb:28-30` does, with the
      composite read living wherever Rails puts it, or this story is blocked with the specific Rails behaviour that
      prevents it.
- [ ] `disable-joins-composite-key.trails.test.ts` passes.
