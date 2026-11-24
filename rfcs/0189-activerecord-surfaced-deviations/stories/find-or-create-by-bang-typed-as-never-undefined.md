---
title: "findOrCreateByBang / createOrFindByBang are typed T | undefined"
status: draft
updated: 2026-11-24
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`find_or_create_by!` (`vendor/rails/v8.0.5.2/activerecord/lib/active_record/relation.rb`,
`find_by(attributes) || create_or_find_by!(attributes, &block)`) never answers
`nil`: `create_or_find_by!` either returns the record or raises. trails types
`Relation#findOrCreateByBang` (`packages/activerecord/lib/relation.ts:946`),
`createOrFindByBang` and the static `findOrCreateByBang`
(`packages/activerecord/lib/querying.ts:690-696`) as `Promise<T | undefined>`,
so every caller needs a non-null assertion: `examples/twitter-clone/db/seeds.ts`
(trails#10727) writes `(await User.findOrCreateByBang(...))!`.

## Acceptance criteria

- The bang readers (`findOrCreateByBang`, `createOrFindByBang`, on `Relation`
  and `Querying`) return `Promise<T>`; the non-bang ones keep `T | undefined`
  only where Rails can answer `nil`.
- The `!` in `examples/twitter-clone/db/seeds.ts` is removed.
