---
title: "SQLite initializeTypeMap keeps unaudited registrations after super"
status: draft
updated: 2026-07-28
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `SQLite3Adapter#initialize_type_map`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:499-502`)
is exactly two lines: `super`, then
`register_class_with_limit m, %r(int)i, SQLite3Integer`. Everything else the
SQLite map resolves comes from `AbstractAdapter#initialize_type_map`
(`abstract_adapter.rb:885-916`).

PR #5541 made `AbstractSQLite3Adapter.initializeTypeMap`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:3040`) call
`super.initializeTypeMap(m)` so the base registrations and aliases are inherited
rather than hand-copied, and deleted the three aliases super already provides
(`clob`, `blob`, `number`). What remains after `super` is still far more than
Rails' single `%r(int)i` override: exact-string registrations for `string`,
`text`, `integer`, `float`, `decimal`, `boolean`, `blob`, `binary`, `json`,
`numeric`, `bigint`; a `/decimal|numeric/i` block that re-implements the base
map's decimal precision/scale extraction with its own inline regexes instead of
`extractScale`/`extractPrecision`; re-declared `/char/i`, `/text/i`, `/binary/i`
via `registerClassWithLimit`; a `/real|floa|doub/i` affinity registration; and
date/time/datetime re-registered so `datetime` lands on `SQLiteDateTimeType`.

Some of these are load-bearing and must survive: `SQLiteDateTimeType` exists
because the driver returns datetime columns as TEXT, the `bigint` entry and
`SQLite3IntegerType#_limit` split are enshrined by
`type_lookup_test.rb:84`'s `_limit` assertion, and the `/timestamp/i` alias must
stay registered _after_ the re-declared `/time/i` or reverse-registration lookup
resolves `timestamp` to Time instead of DateTime. The rest were never audited
against the base map — they are candidates for deletion, not fidelity.

## Acceptance criteria

- [ ] Enumerate every registration remaining in
      `AbstractSQLite3Adapter.initializeTypeMap` after the `super` call and
      classify each as (a) redundant with the inherited base entry — delete, or
      (b) a genuine SQLite override — keep with a justification at the call site
      naming the trails/driver reason.
- [ ] Replace the inline `/decimal|numeric/i` precision/scale regexes with the
      base map's `extractScale`/`extractPrecision` path (or delete the
      registration if the inherited `/decimal/i` block already covers it).
- [ ] Preserve the `/timestamp/i`-after-`/time/i` ordering invariant and the
      `bigint` / `_limit` behaviour; `connection-adapters/type-lookup.test.ts`
      (the port of `type_lookup_test.rb`) must stay green on both the sqlite3
      and sqlite3_mem lanes.
- [ ] No test renames and no invented assertions — the Rails assertion lists are
      already ported in full.
