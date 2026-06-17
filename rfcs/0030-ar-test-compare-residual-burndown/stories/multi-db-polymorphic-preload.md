---
title: "Multi-database polymorphic preload with same table name (pool)"
status: claimed
updated: 2026-06-17
rfc: "0030-ar-test-compare-residual-burndown"
cluster: associations
deps: []
deps-rfc: []
est-loc: 150
priority: 50
pr: null
claim: "2026-06-17T11:01:25Z"
assignee: "multi-db-polymorphic-preload"
blocked-by: null
---

## Context

Surfaced during RFC 0030 story a6-inverse-and-association-tail. The
`multi database polymorphic preload with same table name` test in
`packages/activerecord/src/associations.test.ts` stays `it.skip`. The original
test bypassed the connection handler via direct adapter assignment (multi-DB
pattern); it needs reimplementation against the connection pool (no bypass),
where `Dog` and `OtherDog` are both backed by a `dogs` table in different
databases and a polymorphic preload must resolve each from its own connection.

Rails ref: `vendor/rails/activerecord/test/cases/associations_test.rb`
(`test_multi_database_polymorphic_preload_with_same_table_name`).

## Acceptance criteria

- [ ] Polymorphic preload resolves same-named tables across distinct pooled connections.
- [ ] Un-skip `multi database polymorphic preload with same table name`; it passes.
