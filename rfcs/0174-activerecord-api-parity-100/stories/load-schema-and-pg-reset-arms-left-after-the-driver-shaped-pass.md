---
title: "load-schema-and-pg-reset-arms-left-after-the-driver-shaped-pass"
status: draft
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left from story `sqlite3-pg-and-load-schema-driver-shaped-arms-left-after-the-top-level-pass`, which
converged sqlite3 `typeCast` / `performQuery` and removed the `try` / `catch` from `PG::Connection#reset`.
Two ports still miss Rails arms; a missing arm has no receipt form, so they are listed here only.

- `loadSchema` (`packages/activerecord/src/support/load-schema-helper.ts`) against
  `vendor/rails/v8.0.2/activerecord/test/support/load_schema_helper.rb:4-21`. Rails swaps `$stdout`
  for a `StringIO` inside `begin` / `ensure`, loads `schema.rb`, loads the adapter-specific file
  `if File.exist?`, then calls `ActiveRecord::FixtureSet.reset_cache`. The port takes an `adapter`
  parameter Rails does not have, has no `$stdout` silencing (ruby-compat exports a constant `STDOUT`
  and no reassignable `$stdout`), keeps the existence `if` in the separate exported
  `loadAdapterSpecificSchema`, and never calls `FixtureSet.resetCache`. The pair is body-pinned in
  `scripts/api-compare/body-pins.json` (`load_schema_helper.rb` / `load_schema`), so changing the body
  re-pins it.
- `Connection#reset` (`packages/activerecord/src/pg/connection.ts`) against
  `vendor/pg/v1.5.9/lib/pg/connection.rb:575-586`. The gem resolves DNS afresh
  (`if iopts[:host] && !iopts[:host].empty? && PG.library_version >= 100000` then `resolve_hosts`),
  then `parse_connect_args`, `reset_start2` and `async_connect_or_reset(:reset_poll)`, and returns
  `self`. The port has no `iopts[:host]` arm (node-pg resolves the host inside `connect`, and the
  repo forbids `node:dns`), builds a second `pg.Client` in line where the gem calls `reset_start2`,
  and returns nothing.

## Acceptance criteria

- [ ] `loadSchema` has Rails' `begin` / `ensure` around a silenced `$stdout` and the `File.exist?`
      arm in its own body, and calls `FixtureSet.resetCache`; or the repo owner rules an arm permanent.
- [ ] `Connection#reset` takes the gem's `iopts[:host]` arm and returns `this`; or the repo owner
      rules the arm permanent.
- [ ] `pnpm parity:api:pins` and `pnpm parity:api:arms:throws` are green.
