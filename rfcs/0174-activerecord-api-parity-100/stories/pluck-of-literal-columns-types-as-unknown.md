---
title: "activerecord: pluck of literal column names types as unknown[], not from the schema"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trailmap#31 and trailmap#33 (trails pin `9e17ddc98d`). `Relation#pluck` is declared
`Promise<unknown[]>` (`packages/activerecord/src/relation/calculations.ts:150`), so a caller of
`Story.pluck("id", "rfc_id", "status", "priority")` gets rows it cannot index without a type
assertion or a runtime check. trailmap carries a `pluckedRow()` helper that throws on a non-array
and then `String(...)`s each cell, and review asked for the assertion to go twice.

Rails' `pluck` (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/calculations.rb`
`pluck`) returns an untyped Array, so `unknown[]` is faithful at runtime. The gap is the typing
trails already provides elsewhere: trails-tsc types attribute readers from the schema, and the
columns here are string literals naming schema columns.

## Expected shape

`Model.pluck("a")` types as `Promise<A[]>` and `Model.pluck("a", "b")` as `Promise<[A, B][]>` when
every argument is a literal column name of the model, falling back to `unknown[]` for Arel nodes,
SQL literals and joined-table hashes.

## Acceptance criteria

- [ ] A dts test: single-column and multi-column literal plucks type from the model's attributes; an Arel or SQL-literal argument still types `unknown[]`.
- [ ] trailmap can delete `pluckedRow` and its `String(...)` conversions.
