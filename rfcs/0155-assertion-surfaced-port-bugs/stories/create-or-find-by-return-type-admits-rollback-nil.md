---
title: "createOrFindBy's return type hides Rails' nil-on-rollback behind an as-T cast"
status: in-progress
updated: 2026-09-26
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: trails#8158
claim: "2026-09-26T19:02:03Z"
assignee: "create-or-find-by-return-type-admits-rollback-nil"
blocked-by: null
closed-reason: null
---

## Context

trails#8103 converged `Relation#createOrFindBy` / `#createOrFindByBang`
(`packages/activerecord/src/relation.ts`) onto Rails'
`transaction(requires_new: true) { create(attributes, &block) }`
(`vendor/rails/activerecord/lib/active_record/relation.rb:273-298`), returning
the block's result. `transaction` returns `nil` when the block raises
`ActiveRecord::Rollback`, so Rails' `create_or_find_by` can return `nil`.

trails' `transaction` is typed `Promise<R | undefined>`, and both bodies cast the
result `as T` so the public `Promise<T>` signature (pinned by
`dx-tests/basic-crud.test-d.ts:93-94` and `dx-tests/query-chaining.test-d.ts:57`)
survives. The type now lies on the rollback path.

## Converged shape

`createOrFindBy(...)`: `Promise<T | null>` (or `T | undefined`, matching
`transaction`'s nil spelling), with the `as T` casts removed and the static
`Base.createOrFindBy` / dx-tests updated to the honest type.

## Acceptance criteria

- No `as T` cast in either body; the return type admits Rails' nil.
- dx-tests updated; `relations.test.ts` create-or-find tests stay green.
