---
title: "Un-skip enum NULL-from-database cast test (updateAll raw fragment now supported)"
status: ready
updated: 2026-07-07
rfc: "0050-enum-fidelity"
cluster: null
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

Rails "NULL values from database should be casted to nil"
(vendor/rails/activerecord/test/cases/enum_test.rb, uses
`Book.where(id: @book.id).update_all("status = NULL")` then asserts
`@book.reload.status` is nil and predicates are false).

trails keeps this skipped at `packages/activerecord/src/enum.test.ts:363` with
the note "Rails: `Book.where(id:).update_all(\"status = NULL\")` (raw SQL
fragment)" — but `Relation#updateAll`
(packages/activerecord/src/relation.ts:4117-4140) now accepts a raw SQL string
/ `[sql, ...binds]` (mirrors sanitize_sql_for_assignment), so the stated
blocker no longer exists. Remaining work is verifying `EnumType#deserialize(null)`
returns nil (enum.ts EnumType) through the reload path and un-skipping.

## Acceptance criteria

- [ ] Un-skip `enum.test.ts` "NULL values from database should be casted to
      nil" using the raw-fragment `updateAll` form, mirroring the Rails body
      (test name unchanged).
- [ ] `book.status` after reload is null; `isPublished()` etc. return false —
      matching Rails.
