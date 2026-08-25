---
title: "port-pg-explain-pretty-printer-result"
status: done
updated: 2026-08-17
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6633
claim: "2026-08-17T09:26:50Z"
assignee: "converge-batches-kernel-array-locals"
blocked-by: null
closed-reason: null
---

## Context

`PostgreSQL::ExplainPrettyPrinter#pp`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/explain_pretty_printer.rb`)
takes an `ActiveRecord::Result` and reads `result.columns.first` for the header
and `result.rows.map(&:first)` for the plan lines. trails'
`packages/activerecord/src/connection-adapters/postgresql/explain-pretty-printer.ts:8`
takes `Array<Record<string, unknown>>` instead and hardcodes the header string
`"QUERY PLAN"`, so `postgresql-adapter.ts`'s `explain` has to call
`printer.pp(result.toArray())` where Rails calls `pp(result)`
(postgresql_adapter.rb's `explain`).

Surfaced by the RFC 0096 `wave-4-naming-ar-adapters` cluster: the row
`postgresql-adapter.ts / explain / pp` (`ref:result` -> `ref:toArray`) cannot be
renamed away — the argument really is a different object.

## Acceptance criteria

- [ ] `ExplainPrettyPrinter#pp` takes the `Result`, reading the header from
      `result.columns` and the lines from `result.rows`, mirroring the Ruby
      line for line.
- [ ] `explain` calls `pp(result)`.
- [ ] The `pp` naming row clears in `pnpm parity:api:calls:args:report` with no
      new `shape` row.
- [ ] PostgreSQL lane green (the explain tests cover TEXT and JSON plans).
