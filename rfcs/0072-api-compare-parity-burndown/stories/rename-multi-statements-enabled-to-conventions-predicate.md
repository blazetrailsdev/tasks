---
title: "rename-multi-statements-enabled-to-conventions-predicate"
status: ready
updated: 2026-08-04
rfc: "0072-api-compare-parity-burndown"
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

`Mysql2::DatabaseStatements#multi_statements_enabled?`
(activerecord/lib/active_record/connection_adapters/mysql2/database_statements.rb)
is ported in
`packages/activerecord/src/connection-adapters/mysql2/database-statements.ts:182`
as `multiStatementsEnabled`. `docs/ruby-ts-conventions.md` translates a Ruby
`?` predicate with an `is` prefix, so the matched name is
`isMultiStatementsEnabled` and `api:compare` reports the method unported. It is
the only name divergence left by the triage in
`docs/infrastructure/mixin-attribution-triage.md` (2026-08-04).

## Acceptance criteria

- The function and every call site use the conventions name.
- `pnpm api:compare` credits the method.
