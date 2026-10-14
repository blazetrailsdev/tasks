---
title: "SQLite3Adapter#configure_connection tests the pragma writer with method_defined?, not an own-property check"
status: closed
updated: 2026-10-14
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: 'rfc-refine 0189 (2026-10-14, trails origin/main 03da862b8a): Duplicate of sqlite3-configure-connection-pragma-check-matches-set-helpers (ready, this RFC): both target the same `Object.hasOwn(Pragmas, setter)` check at origin/main sqlite3-adapter.ts:1067 vs Rails'' `SQLite3::Pragmas.method_defined?("#{pragma}=")`. The claimer of the surviving story should take this one''s converged shape (Pragmas as a ruby-compat Module, rbModMethodDefined + rbFPublicSend on the `name=` writer).'
---

## Context

`SQLite3Adapter#configure_connection` asks the pragma module whether it defines a writer before sending it: `if ::SQLite3::Pragmas.method_defined?("#{pragma}=")` then `@raw_connection.public_send("#{pragma}=", value)` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:838-843`).

The port (`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:1060-1070`) builds `set${camelize(pragma)}` and tests `Object.hasOwn(Pragmas, setter)`, then calls the function off the object literal with `.call(this._rawConnection)`. `Pragmas` (`packages/activerecord/src/sqlite/pragmas.ts:576`) is an object literal of functions, so `rbModMethodDefined` (`packages/ruby-compat/src/object.ts:627`), which takes a class or a `Module` answering `isMethodDefined`, cannot be handed it. Before trails#8788 the same test was spelled `hasKey(Pragmas, setter)`; neither is `method_defined?`.

## Acceptance criteria

- [ ] `Pragmas` is a receiver `rbModMethodDefined` accepts (a ruby-compat `Module`, as `SQLite3::Pragmas` is a module mixed into `SQLite3::Database`), and `configureConnection` asks `rbModMethodDefined` for the `name=` writer of the pragma.
- [ ] The write goes through `rbFPublicSend` on the raw connection with the `name=` writer, as Rails' `public_send` does, where the raw connection includes the module.
- [ ] `pnpm parity:api:calls` and `:calls:args` green with no baseline row or receipt added.
- [ ] `packages/activerecord/src/sqlite/pragmas.test.ts`, `pragmas.trails.test.ts` and `adapters/sqlite3/sqlite3-adapter.test.ts` pass.
