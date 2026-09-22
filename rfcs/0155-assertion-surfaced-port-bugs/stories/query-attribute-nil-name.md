---
title: "QueryAttribute accepts a nil name as Rails does"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails `Relation::QueryAttribute.new(nil, 1, Type::Value.new)` is legal
(`vendor/rails/activerecord/test/cases/adapters/sqlite3/sqlite3_adapter_test.rb:443`,
`activerecord/lib/active_record/relation/query_attribute.rb`). trails'
`QueryAttribute` constructor (`packages/activerecord/src/relation/query-attribute.ts:34`)
types `name: string`, so the ported test "exec query with binds" passes `""` (trails#7875).

## Acceptance criteria

- Constructor accepts a nil name as Rails does (`name: string | null`, following through `Attribute`).
- "exec query with binds" in `sqlite3-adapter.test.ts` passes `null`.
