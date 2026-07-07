---
title: "sqlite3 fetchTypeMetadata parses sql_type by hand instead of sourcing from cast_type"
status: in-progress
updated: 2026-07-07
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 73
pr: 4762
claim: "2026-07-07T23:18:24Z"
assignee: "sqlite-fetchtypemetadata-bespoke-parse-vs-rails-casttype"
blocked-by: null
---

## Context

Surfaced by PR #4378 (fix-defineschema-materialization-precision-scale-limit-roundtrip).

trails' `AbstractSQLite3Adapter#fetchTypeMetadata`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:1064`) is a
bespoke parser: it regex-extracts a single-arg `(N)` as limit/precision, strips
the parens from `sqlType`, and hardcodes `scale`. Rails'
`fetch_type_metadata`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1717-1726`)
instead carries the full `sql_type` verbatim and sources
`limit`/`precision`/`scale` straight off the resolved `cast_type`.

PR #4378 converged the decimal branch onto the cast type (re-resolving from the
full string) but left the general path bespoke. The blocker to full convergence
is the SQLite integer registration seeding a default `limit: 8`
(`initializeTypeMap` → `sqlite3Int`), so blindly sourcing `cast_type.limit`
would stamp `limit: 8` on every integer column and over-emit `limit:` in dumps.

## Acceptance criteria

- [ ] `fetchTypeMetadata` sources limit/precision/scale from the cast type for
      all types (Rails-faithful), not just decimal, retaining the full
      `sql_type`.
- [ ] The SQLite integer default-8 limit no longer leaks into reflected column
      `limit` (dumps stay bare for unlimited integers; `c_int_1..8` keep 1..8).
- [ ] test:compare non-negative.
