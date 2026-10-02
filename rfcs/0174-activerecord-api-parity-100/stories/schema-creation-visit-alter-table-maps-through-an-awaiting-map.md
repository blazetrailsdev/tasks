---
title: "activerecord: SchemaCreation#visit_AlterTable maps its visitors through an awaiting map"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: receipts
packages: ["activerecord"]
deps: ["preloader-through-records-by-owner-map-awaits-each-loader"]
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-ca-abstract` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`SchemaCreation#visit_AlterTable` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/schema_creation.rb:24-32`):

```ruby
def visit_AlterTable(o)
  sql = +"ALTER TABLE #{quote_table_name(o.name)} "
  sql << o.adds.map { |col| accept col }.join(" ")
  sql << o.foreign_key_adds.map { |fk| visit_AddForeignKey fk }.join(" ")
  sql << o.foreign_key_drops.map { |fk| visit_DropForeignKey fk }.join(" ")
  sql << o.check_constraint_adds.map { |con| visit_AddCheckConstraint con }.join(" ")
  sql << o.check_constraint_drops.map { |con| visit_DropCheckConstraint con }.join(" ")
  sql << o.constraint_drops.map { |con| visit_DropConstraint con }.join(" ")
end
```

In trails `accept`, `visitAddForeignKey`, `visitAddCheckConstraint` and `visitDropCheckConstraint`
are async (they reach `supports_*?` probes that query), so
`packages/activerecord/src/connection-adapters/abstract/schema-creation.ts`'s `visitAlterTable` writes four `for … of` loops that await each visitor and
push — a sequential `map` with no `map` call ahead of the visitor — and carries
`@missingRailsCall order:accept,map`. `Promise.all(o.adds.map(...))` would restore the order row but
starts every visitor at once, where Ruby runs them in order on one connection.

This is the same shape `preloader-through-records-by-owner-map-awaits-each-loader` (this RFC)
resolves with a ruby-compat `map` that awaits each block result in order. Land that first and call
its export here.

## Acceptance criteria

- [ ] `visitAlterTable` is six `sql += (await map(o.xs, (x) => this.visitX(x))).join(" ")` lines (the two synchronous visitors keep `Array#map`), with no hand-written loop and no local Rails does not have.
- [ ] The `@missingRailsCall order:accept,map` receipt is deleted; `pnpm parity:api:calls` green with no new row.
- [ ] The PostgreSQL `visit_AlterTable` override (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/schema_creation.rb`) is checked for the same loop and converged in the same PR if present.

## Verification

```bash
pnpm parity:api:calls && pnpm vitest run packages/activerecord/src/connection-adapters/abstract/schema-creation.trails.test.ts packages/activerecord/src/migration/foreign-key.test.ts
```
