---
title: "Collapse SchemaDumper#tables' duplicated sync fast path into Rails' single body"
status: draft
updated: 2026-08-11
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while landing #6369. Rails' `SchemaDumper#tables` has ONE body
(`schema_dumper.rb:134-155`). The trails port has two: an async branch (taken
when `SchemaSource#tables()` returns a Promise, i.e. every real adapter) and a
synchronous fast path for mock sources, which re-implements the table walk
inline — reading `columns`/`indexes`/`fetchTableOptions`, setting `tableName`,
and calling `emitTable` directly instead of going through `table()`.

`packages/activerecord/src/schema-dumper.ts` `tables(stream)`:

- the async branch was converged by #6369 (`sortedTables`, `notIgnoredTables`,
  the `tbl`/`foreignKeysStream` FK loop);
- the sync branch below it still carries the duplicated walk, never calls
  `table()`, never dumps foreign keys, and throws two bespoke `TypeError`s
  ("returned a Promise while tables() was synchronous") that have no Rails
  counterpart.

So every fix to the dump has to be made twice, and the sync path silently skips
`filterIndexesForDump`, `gatherInlineConstraints` and `foreignKeys`.

## Acceptance criteria

1. `tables()` has a single body matching `schema_dumper.rb:134-155`; the
   sync-only walk and its two bespoke `TypeError`s are gone.
2. The mock `SchemaSource` implementations that motivated the sync path either
   return promises or are driven through the async path (Rails' `@connection`
   is always the real thing, so a sync source is a trails-only shape).
3. `schema-dumper.test.ts` stays green, including the tests that construct a
   dumper over a plain object source.
