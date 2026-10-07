---
title: "sqlite3-adapter.ts: quoteDefaultExpression is a second body for the SQLite3::Quoting mixin function"
status: draft
updated: 2026-10-07
rfc: "0181-activerecord-member-placement"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left by trails PR 8642, which moved the remaining `SQLite3Adapter` delegation wrappers onto the prototype. One class-body method in `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts` is still a second body for a method the mixin file already ports:

- `override quoteDefaultExpression(value, column)` re-implements the Proc arm and calls `super`. `packages/activerecord/src/connection-adapters/sqlite3/quoting.ts` already exports a `this`-typed `quoteDefaultExpression` with the same body, the port of `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3/quoting.rb:99-111`.

Rails defines `quote_default_expression` once, in `SQLite3::Quoting`, and `SQLite3Adapter` only includes the module (`sqlite3_adapter.rb`). CLAUDE.md "Module mixins" forbids the duplicate.

## Acceptance criteria

- [ ] `SQLite3Adapter` has no class-body `quoteDefaultExpression`; it is `SQLite3Adapter.prototype.quoteDefaultExpression = sqliteQuoteDefaultExpression` with a bodiless interface declaration, as PR 8642 did for `quoteString` and its siblings.
- [ ] `scripts/mixin-declaration-drift.test.ts` passes and `pnpm parity:api:pins` is clean (prune the stale `sqlite3_adapter.rb` pin with `body-pins.ts --prune`).
- [ ] SQLite adapter and migration tests are green.
