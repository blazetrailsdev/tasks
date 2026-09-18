---
title: "deferrable-error-message-symbol-inspect"
status: draft
updated: 2026-09-18
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails `postgresql/schema_statements.rb` (`validate_deferrable`-equivalent) raises
"deferrable must be `:immediate` or `:deferred`, got: `true`" (`vendor/rails/activerecord/test/cases/migration/unique_constraint_test.rb:132-138`,
`exclusion_constraint_test.rb`). trails `connection-adapters/postgresql/schema-statements.ts:678` renders
`"immediate"` via JSON.stringify instead of the Symbol inspect form.

## Acceptance criteria

- Message matches Rails exactly (Symbol inspect, `:immediate`).
- Un-skip `add unique constraint with deferrable invalid` and `add exclusion constraint deferrable invalid`.
