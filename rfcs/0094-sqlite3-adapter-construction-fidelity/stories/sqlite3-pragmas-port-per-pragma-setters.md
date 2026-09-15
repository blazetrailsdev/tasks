---
title: "sqlite3-pragmas-port-per-pragma-setters"
status: done
updated: 2026-09-15
rfc: "0094-sqlite3-adapter-construction-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7767
claim: "2026-09-15T00:19:43Z"
assignee: "sqlite3-pragmas-port-per-pragma-setters"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/sqlite/pragmas.ts` `setPragma(name, value)` is an
invented dispatcher: it picks `setEnumPragma` / `setIntPragma` /
`setBooleanPragma` from lookup tables and returns SQL text. The gem instead
defines one writer per pragma on `SQLite3::Pragmas`
(`vendor/sqlite3/lib/sqlite3/pragmas.rb:105` `application_id=`, `:113`
`auto_vacuum=`, `:121` `automatic_index=`, …), each calling
`set_int_pragma` / `set_enum_pragma` / `set_boolean_pragma`
(`pragmas.rb:18,60,75`), which `execute("PRAGMA …")` directly. Rails reaches
them via `::SQLite3::Pragmas.method_defined?("#{pragma}=")` then
`@raw_connection.public_send("#{pragma}=", value)`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:838-844`).
trails' `PRAGMA_SETTERS` set stands in for `method_defined?`.

The gem is now vendored and scored as the `sqlite3` api-compare package
(from the `gem-ports-score-as-extra-surface` bundle), so `setPragma` and
`PRAGMA_SETTERS` show up as novel there; `setPragma` carries
`@noRailsEquivalent CONVERGEABLE sqlite3-pragmas-port-per-pragma-setters`.

## Acceptance criteria

- [ ] `pragmas.ts` exports the gem's per-pragma writers (`setX` spelling per
      docs/ruby-ts-conventions.md for `x=`) delegating to
      `setBooleanPragma` / `setIntPragma` / `setEnumPragma`.
- [ ] `SQLite3Adapter#configure_connection` dispatches by name as Rails'
      `method_defined?` / `public_send` does; `setPragma` and its receipt are
      deleted.
- [ ] `pnpm parity:api:extra --package sqlite3` no longer lists `setPragma`.
