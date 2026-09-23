---
title: "sqlite3 Pragmas getters are unported"
status: draft
updated: 2026-09-23
rfc: "0094-sqlite3-adapter-construction-fidelity"
cluster: null
packages: []
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

`packages/activerecord/src/sqlite/pragmas.ts` ports only the setters from
`vendor/sqlite3/lib/sqlite3/pragmas.rb`. The getters are unported:

- the helpers `get_boolean_pragma` (`:11`), `get_query_pragma` (`:41`),
  `get_enum_pragma` (`:51`) and `get_int_pragma` (`:69`);
- the per-pragma readers built on them (`foreign_keys`, `journal_mode`,
  `cache_size`, …).

trails#7993 added the prerequisite: `SqliteConnection#execute`
(`packages/activerecord/src/sqlite-adapter.ts`, implemented in the four
bindings under `src/sqlite/`). It returns frozen rows, as `Database#execute`
does (`vendor/sqlite3/lib/sqlite3/database.rb:247-259`). So the getters can
read `this.execute(...)` rows exactly as the gem does. Trails code that reads a
pragma today goes through the non-gem `SqliteConnection#pragma` instead.

## Acceptance criteria

- [ ] `get_boolean_pragma`, `get_query_pragma`, `get_enum_pragma` and `get_int_pragma` are ported into `sqlite/pragmas.ts` with gem names and bodies, reading `this.execute`.
- [ ] Each per-pragma reader in `pragmas.rb` is ported next to its setter.
- [ ] `parity:api:extra --package sqlite3` shows no new novel surface.
