---
title: "sqlite3 configureConnection treats Pragmas set_*_pragma helpers as known pragmas"
status: draft
updated: 2026-09-23
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `configure_connection`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:837-844`)
checks each configured pragma with
`::SQLite3::Pragmas.method_defined?("#{pragma}=")`. That is true only for the
per-pragma setters (`foreign_keys=`, `journal_mode=`, …) in
`vendor/sqlite3/lib/sqlite3/pragmas.rb`.

trails' `configureConnection`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`, the
`DEFAULT_PRAGMAS` loop) checks `hasKey(Pragmas, "set" + camelize(pragma))`.
Since trails#7996, the `Pragmas` object in `packages/activerecord/src/sqlite/pragmas.ts`
also holds the public helpers `setBooleanPragma`, `setEnumPragma` and
`setIntPragma` (gem `set_boolean_pragma` / `set_enum_pragma` / `set_int_pragma`,
`pragmas.rb:18-35,62-67,75-77`). So a `pragmas:` config key of
`boolean_pragma`, `enum_pragma` or `int_pragma` counts as a known pragma. It
calls the helper with the wrong arguments, where Rails warns
`Unknown SQLite pragma: <name>`.

The cause is that trails spells Ruby `x=` as `setX`, which collides with the
gem's own `set_x` names.

## Converged shape

The existence check answers exactly what `method_defined?("#{pragma}=")` answers:
only per-pragma setters. For example, check against the set of names generated
from the `x=` methods, not every key of the `Pragmas` object. The helpers stay
public, as they are in the gem.

## Acceptance criteria

- [ ] `pragmas: { boolean_pragma: 1 }` warns `Unknown SQLite pragma: boolean_pragma` and runs no statement, as Rails does.
- [ ] Every real per-pragma setter is still dispatched.
