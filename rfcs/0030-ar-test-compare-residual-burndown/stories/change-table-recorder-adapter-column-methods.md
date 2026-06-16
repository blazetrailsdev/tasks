---
title: "change_table recorder proxy surfaces adapter column-type shorthands (t.hstore)"
status: done
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: adapter
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 3455
claim: "2026-06-16T13:41:02Z"
assignee: "change-table-recorder-adapter-column-methods"
blocked-by: null
---

## Context

Surfaced by `e2-pg-ddl-via-exec` (RFC 0030). In a `change` migration's recording
mode, `change_table` yields a `RecorderTableProxy`
(`migration/command-recorder.ts:641`) that exposes only the generic column
shorthands (string/integer/datetime/...). It lacks the adapter-specific column
methods that Rails mixes in via `PostgreSQL::ColumnMethods` (`hstore`, `jsonb`,
`uuid`, `inet`, ...). So `t.hstore :keys` inside a reversible `change` raises
`t.hstore is not a function`.

Blocks `adapters/postgresql/hstore.test.ts` test `hstore migration`
(Rails `hstore_test.rb:86` `test_hstore_migration`), which runs a
`Migration::Current` subclass whose `change` does
`change_table("hstores") { |t| t.hstore :keys }` and asserts up adds / down
removes the column.

Note the non-recording path (`adapter.changeTable` with `t.column(name,
"hstore")`) already works — see passing `change table supports hstore`. The gap
is the recorder proxy not surfacing adapter column-type shorthands.

## Acceptance criteria

- [ ] `change_table` recording-mode proxy surfaces adapter column-type
      shorthands (faithful to Rails' adapter `ColumnMethods` mixin), recording
      them as `addColumn(name, type, ...)`.
- [ ] Un-skip `hstore migration` in `hstore.test.ts`; up/down reversibility
      passes under PG.
