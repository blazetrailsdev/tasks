---
title: "PG changeColumnDefault should route through change_column_default_for_alter"
status: claimed
updated: 2026-07-23
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-07-23T16:40:38Z"
assignee: "pg-change-column-default-route-through-for-alter"
blocked-by: null
closed-reason: null
---

# PG changeColumnDefault hand-rolls SQL instead of routing change_column_default_for_alter

## Context

Rails PG `change_column_default` (vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb:486) executes
`ALTER TABLE ... #{change_column_default_for_alter(table, column, default_or_changes)}`,
so the non-bulk path shares the builder + `visit_ChangeColumnDefaultDefinition`
machinery. trails' PG `changeColumnDefault`
(packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.ts, `changeColumnDefault`, ~line 966-990)
hand-rolls the DROP/SET DEFAULT SQL against the live column and calls
`quoteDefaultExpression` directly, bypassing
`buildChangeColumnDefaultDefinition` + the visitor that PR #5150 wired for the
bulk path (abstract/schema-statements.ts `changeColumnDefaultForAlter`).

## Acceptance criteria

- [ ] PG `changeColumnDefault` routes through `changeColumnDefaultForAlter`
      (builder + visitor), mirroring postgresql/schema_statements.rb:486.
- [ ] Existing defaults/migration tests stay green on PG.
