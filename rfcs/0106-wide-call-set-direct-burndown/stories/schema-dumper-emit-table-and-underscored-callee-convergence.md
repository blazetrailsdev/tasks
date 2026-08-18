---
title: "Converge SchemaDumper#table's emitTable split and the _run/_crc32 callees"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 6698
claim: "2026-08-18T13:36:45Z"
assignee: "schema-dumper-emit-table-and-underscored-callee-convergence"
blocked-by: null
closed-reason: null
---

## Context

`wave-4e-schema-dumper-migration-residue` reviewed all 38 rows in
`schema-dumper.json` / `migration.json` / `migration/command-recorder.json` /
`schema.json`; two converged and the rest now carry verified per-site reasons.
Four of those reasons record REAL port divergence rather than a Ruby/JS
equivalence, and are the burndown left behind:

- `SchemaDumper#table` (9 rows) — Rails emits the columns inline
  (`schema_dumper.rb:158-243`); the port hands that half to `emitTable`
  (`packages/activerecord/src/connection-adapters/abstract/schema-dumper.ts:238-351`),
  so `column_spec`, `column_spec_for_primary_key`, `format_colspec`,
  `format_options`, `table_options`, `valid_type?`, `indexes_in_create`,
  `unique_constraints_in_create`, `exclusion_constraints_in_create` are made in
  a different FILE and cannot be credited. RFC 0051 territory — coordinate with
  its open schema-dumper stories.
- `SchemaDumper#index_parts` — `!@connection.default_index_type?(index)`
  (`schema_dumper.rb:275`) is inlined as `index.using !== "btree"`
  (`schema-dumper.ts:984`). The adapter predicate exists
  (`abstract-adapter.ts:1975`) but is nil-only on SQLite, so routing through it
  changes the SQLite dump — needs a test-verified flip, not a mechanical one.
- `Migration#revert` — Rails calls `run(...)` (`migration.rb:853`); the port
  spells the same method `_run` (`migration.ts:1168`).
- `Migrator#generate_migrator_advisory_lock_id` — the CRC-32 helper is
  `_crc32` (`migration.ts:2642`), so the underscored name cannot match
  Ruby's `Zlib.crc32`.

## Acceptance criteria

- The `_run` / `_crc32` names converge on the Rails spelling (or the rename is
  shown to collide, with the collision named).
- `index_parts` routes through the adapter predicate, with the SQLite dump
  behaviour pinned by a test either way.
- The `table` cluster converges or is explicitly handed to a named RFC 0051
  story; the corresponding rows leave
  `scripts/api-compare/call-mismatches-exclude/activerecord/schema-dumper.json`
  by deletion, with `pnpm parity:api:calls:tighten` for the shard.
- Both call gates green; SQLite, PostgreSQL and MySQL lanes green.
