---
title: "Give canonical full-schema-dump tests timeout headroom under PG fork load"
status: claimed
updated: 2026-07-04
rfc: "0060-reduce-test-drop-churn"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-07-04T16:19:28Z"
assignee: "add-timeout-headroom-to-canonical-full-dump-tests"
blocked-by: null
closed-reason: null
---

## Context

PR #4547 (scope-full-schema-dump-tests-off-empty-db) scoped the _bespoke_
full-dump cases in `packages/activerecord/src/schema-dumper.test.ts` off the
empty-DB assumption by switching them to the non-enumerating
`SchemaDumper.dumpTableSchema(adapter, name)`. But the **first `describe`
("SchemaDumperTest", canonical)** uses `fixtures({})` + `standardDump()` =
`dumpAllTableSchema(canonicalSource())` — a genuine _full_ dump of all ~330
canonical tables. Those cases (e.g. "schema dump", "types no line up",
"arguments no line up", "no dump errors", "schema dump should honor nonstandard
primary keys") cannot be table-scoped: they assert on the whole standard dump,
mirroring Rails' `standard_dump`.

On a single local PostgreSQL worker (no fork contention) these full-dump cases
each run ~4.1–4.8s — already near the 5s per-test vitest timeout. Under CI's
6-worker PG fork load they are one contention spike from timing out. This is
the same latent 5s dump-timeout class documented for `comment.test` and
`schema-dumper.trails.test` (currently "re-run, don't fix"). Now that the
truncate-based global reset (PR #4504) leaves the ~330 canonical tables in
place, every full standard dump introspects all of them per test.

trails refs:

- `packages/activerecord/src/schema-dumper.test.ts:50-52` (`standardDump` →
  `dumpAllTableSchema(canonicalSource())`) and the ~6 cases in the first
  `describe` that call it (lines ~68-144).
- Rails: `activerecord/test/cases/schema_dumper_test.rb` `standard_dump` /
  `SchemaDumpingHelper#dump_all_table_schema` (inherently full).

## Acceptance criteria

- The canonical full-dump cases in the first `SchemaDumperTest` `describe` no
  longer flake at the 5s timeout under CI PG fork load. Prefer giving just
  these known-heavy full-dump cases explicit per-test timeout headroom (vitest
  `it(name, fn, timeout)`), scoped to the full-dump cases only — do NOT raise
  the global test timeout and do NOT alter test names (they match Rails).
- If a cheaper structural fix exists (e.g. the standard dump introspecting
  fewer tables, or a warmed schema-cache path), prefer it over a bare timeout
  bump and note the reasoning.
- No new `dropAllTables` callers; do not reintroduce an empty-DB precondition.
