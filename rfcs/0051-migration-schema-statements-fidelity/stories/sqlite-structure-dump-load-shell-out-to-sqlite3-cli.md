---
title: "SQLiteDatabaseTasks structure_dump/structure_load shell out to the sqlite3 CLI as Rails does"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6231
claim: "2026-08-08T12:39:58Z"
assignee: "checkout-raw-test-adapter-pools-are-never-disconnected"
blocked-by: null
closed-reason: null
---

## Context

`SQLiteDatabaseTasks#structureDump` / `#structureLoad`
(`packages/activerecord/src/tasks/sqlite-database-tasks.ts`) run their work
through the adapter, querying `sqlite_master` and re-executing the dump with
`exec`. Rails shells out to the `sqlite3` CLI in both:

- `vendor/rails/activerecord/lib/active_record/tasks/sqlite_database_tasks.rb:43-58`
  (`structure_dump` → `run_cmd("sqlite3", args, filename)`, `.schema --nosys`
  or a `SELECT sql || ';' FROM sqlite_master ... ORDER BY tbl_name, type DESC, name`
  when `SchemaDumper.ignore_tables` is non-empty)
- `.../sqlite_database_tasks.rb:60-66` (`structure_load`)

The trails file's own header documents the deviation ("Unlike Rails (which
shells out to the `sqlite3` CLI ...), trails runs structureDump/structureLoad
through the SQLite3Adapter so the same code works under sqlite-wasm + the
activesupport vfs adapter"), and the ported `runCmd` helper exists but is never
invoked by the public task methods.

The divergence is not only the transport. The adapter path had to reorder the
dump (`CASE type WHEN 'table' THEN 0 ...` instead of Rails' `type DESC`)
because `db.exec` applies statements strictly in order where the sqlite3 shell
resolves forward-referenced triggers lazily, and it had to add a
`name NOT LIKE 'sqlite_%'` filter that Rails gets implicitly from `.schema`.
So the emitted structure.sql differs from Rails' for the same database.

Surfaced while closing `database-tasks-adapters-carry-a-real-pool` (PR #6213),
which converged the adapter-construction half of this file but deliberately
left the CLI question alone.

## Converged shape

`structure_dump` / `structure_load` shell out via the already-ported `runCmd`,
with Rails' argument construction and Rails' `ORDER BY tbl_name, type DESC, name`,
so the dump is byte-comparable with Rails'. The vfs/sqlite-wasm constraint the
header cites is the thing to establish or refute first: if a lane genuinely has
no `sqlite3` binary, that lane is the deviation to carry (guarded and named),
not the default path.

## Acceptance criteria

- [ ] `structureDump` / `structureLoad` invoke `runCmd("sqlite3", ...)` with
      Rails' argument list and Rails' ordering.
- [ ] The bespoke `CASE type ...` ordering and the `sqlite_%` filter are gone,
      or are scoped to an explicitly-named non-CLI fallback.
- [ ] `test_structure_dump_and_load_round_trip_via_adapter` still passes (or is
      replaced by the Rails-named test it stands in for — do not rename it in
      place).
- [ ] Green on sqlite (file lane) and `sqlite3_mem`.
