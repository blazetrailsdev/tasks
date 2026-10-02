---
title: "arel: ToSql's four comparison visitors share an invented visitBinaryOp where Rails inlines the tail"
status: draft
updated: 2026-10-02
rfc: "0172-arel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while shipping trails PR 8397.

Rails writes each comparison visitor's tail in line
(`vendor/rails/v8.0.2/activerecord/lib/arel/visitors/to_sql.rb:436-482`):

```ruby
def visit_Arel_Nodes_GreaterThanOrEqual(o, collector)
  case unboundable?(o.right)
  when 1 then return collector << "1=0"
  when -1 then return collector << "1=1"
  end
  collector = visit o.left, collector
  collector << " >= "
  visit o.right, collector
end
```

`GreaterThan`, `LessThanOrEqual` and `LessThan` are the same three lines with their own operator.
`Arel::Visitors::ToSql` has no shared helper for them (`grep -n binary_op to_sql.rb` is empty).

`packages/arel/src/visitors/to-sql.ts` routes all four through `visitBinaryOp(o, op, collector)`
(defined near `:1226`, called at `:522,532,545,555`), a protected helper Rails does not have.

## Converged shape

Each of the four visitors ends with Rails' three statements — `collector = this.visit(o.left, collector)`,
`collector.append(" >= ")`, `return this.visit(o.right, collector)` — and `visitBinaryOp` is deleted
if no other caller remains (check the dialect visitors under `packages/arel/src/visitors/`).

## Acceptance criteria

- [ ] The four comparison visitors inline the Rails tail; `visitBinaryOp` is gone or has only callers whose Rails body shares a helper.
- [ ] `pnpm parity:api:calls`, `pnpm parity:api:extra:gate` and `pnpm parity:api:arms:report --package=arel` show no new row.

## Verification

```bash
pnpm vitest run packages/arel/src/visitors && pnpm parity:api:calls && pnpm parity:api:extra:gate
```
