---
title: "rename-multi-statements-enabled-to-conventions-predicate"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: 6101
claim: "2026-08-04T23:11:10Z"
assignee: "of-kind-default-type-and-normalize-arguments"
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
`isMultiStatementsEnabled` and `parity:api` reports the method unported. It is
the only name divergence left by the triage in
`docs/infrastructure/mixin-attribution-triage.md` (2026-08-04).

## Acceptance criteria

- The function and every call site use the conventions name.
- `pnpm parity:api` credits the method.
