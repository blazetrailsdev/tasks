---
title: "sqlite3 Pragmas#table_info and its private helpers are unported"
status: draft
updated: 2026-09-23
rfc: "0023-surfaced-deviations"
cluster: null
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#7996 ported the Pragmas getters, the per-pragma readers and the
`&block` arm of `get_query_pragma` / `Database#execute` into
`packages/activerecord/src/sqlite/pragmas.ts` and the four bindings under
`src/sqlite/`. One part of `vendor/sqlite3/lib/sqlite3/pragmas.rb` is still
missing:

- **`table_info` (`:525-556`)**, with its private helpers `version_compare`
  (`:560-571`) and `tweak_default` (`:576-585`). It needs:
  - `prepare`;
  - `Statement#columns`, which expo-sqlite's binding stubs to `[]` today;
  - `SQLite3.libversion`, which trails does not port.

(The story slug still names the block arm, which trails#7996 shipped.)

## Acceptance criteria

- [ ] `tableInfo`, `versionCompare` and `tweakDefault` are ported into `sqlite/pragmas.ts` with gem names and bodies, including the block arm.
- [ ] `SQLite3.libversion` is available to `tableInfo` without a trails-only query standing in for it.
