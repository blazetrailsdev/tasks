---
title: "activerecord: PostgreSQL indexes / foreign_keys / unique_constraints map their rows through an awaiting map"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
deps: ["preloader-through-records-by-owner-map-awaits-each-loader"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-ca-drivers` audit: the 3 receipts below were
`@missingRailsCall … — PERMANENT`, no CLAUDE.md section ratifies them, and they are re-tagged
`CONVERGEABLE` onto this story.

`packages/activerecord/src/connection-adapters/postgresql/schema-statements.ts`:

- `indexes` — `order:split,map`. Rails maps the result
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb:103-151`,
  `result.map do |row| … end`), and `split` / the inner `map` run inside that block.
- `foreignKeys` — `order:unquoteIdentifier,map` (`schema_statements.rb:600-626`, `fk_info.map do |row|`).
- `uniqueConstraints` — `order:split,map` (`schema_statements.rb:710-724`, `unique_info.map do |row|`).

In trails each block awaits `columnNamesFromColumnNumbers`, so all three bodies are `for … of` loops that
push onto an array: a sequential `map` with no `map` call, which puts the first `map` the gate sees after
the calls Rails makes inside it. `Promise.all(rows.map(...))` would emit the call but start every lookup
at once on one connection.

This is the shape `preloader-through-records-by-owner-map-awaits-each-loader` already owns for the
preloader: ruby-compat has no awaiting `map`, and that story adds one. This story depends on it.

The same three bodies deviate in ways the order row hides, and they are in front of whoever does this:

- `indexes` splits `indkey` with `/\s+/` plus a `filter` where Rails has `row[2].split(" ")` (`:106`),
  reads the `inddef` captures through `match` and `?.[n] ?? ""` where Rails has `scan(...).flatten`
  (`:111`), builds `columns` with `filter` where Rails has `reject!` (`:123`), and passes
  `include` / `nullsNotDistinct` / `comment` through hand-written ternaries where Rails has
  `.presence` / `.present?` (`:146-148`).
- `foreignKeys` reads `conkey` / `confkey` with `replace(/[{}]/g, "").split(",")` where Rails has
  `scan(/\d+/).map(&:to_i)` (`:602-603`).
- `uniqueConstraints` passes `nullsNotDistinct || undefined` where Rails passes the boolean (`:719`).

## Acceptance criteria

- [ ] The three bodies map their rows through the awaiting `map` the dependency adds, and the
      hand-written loops are gone.
- [ ] The three `@missingRailsCall order:…` receipts are deleted; `pnpm parity:api:calls` green with no
      new row.
- [ ] The deviations listed above are converged in the same PR, or each is filed with its Rails line.
- [ ] The PostgreSQL schema-reflection tests pass on the PostgreSQL lane.

## Verification

```bash
pnpm parity:api:calls && pnpm vitest run packages/activerecord/src/connection-adapters/postgresql/schema-statements.trails.test.ts
```
