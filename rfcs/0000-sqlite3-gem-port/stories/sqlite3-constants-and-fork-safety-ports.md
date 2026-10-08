---
title: "sqlite3: SQLite3::Constants and ForkSafety.suppress_warnings! at their gem homes"
status: draft
updated: 2026-10-08
rfc: "0000-sqlite3-gem-port"
cluster: package
packages: ["sqlite3", "activerecord"]
deps: ["sqlite3-lift-the-nested-port-into-a-package"]
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

- `SQLite3Constants` (`packages/activerecord/src/sqlite-adapter.ts:84-132`) is a trails-named object; the gem has
  `SQLite3::Constants` with nested modules in `vendor/sqlite3/v2.6.0/lib/sqlite3/constants.rb` (`TextRep` `:9`,
  `ColumnType` `:39`, `ErrorCode` `:55`, `Status` `:126`, `Optimize` `:174`) and `Open` in C
  (`vendor/sqlite3/v2.6.0/ext/sqlite3/sqlite3.c:158`). Rails reads `::SQLite3::Constants::Open::SHAREDCACHE`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:473`); trails reads `SQLite3Constants.Open.SHAREDCACHE`
  (`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:687`).
- `SQLite3::ForkSafety.suppress_warnings!` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:18`,
  `vendor/sqlite3/v2.6.0/lib/sqlite3/fork_safety.rb:59`) has no trails counterpart. JS has no `fork`.

## Acceptance criteria

- [ ] `packages/sqlite3/src/constants.ts` is `SQLite3.Constants` with the gem's module nesting, holding the members trails reads (name each with its call site in the README) and no others.
- [ ] Every `SQLite3Constants.` reference in activerecord and the engines becomes `SQLite3.Constants.`; the old object is deleted.
- [ ] `ForkSafety.suppress_warnings!`: either `fork-safety.ts` ports the one method as the flag write it is and `sqlite3-adapter.ts` calls it at module scope as `sqlite3_adapter.rb:18` does, or `fork_safety.rb` is an `unported-files` row with the reason "JS has no fork" and the call carries `@missingRailsCall suppress_warnings! — PERMANENT`. Choose the port unless it needs invented surface.

## Verification

```bash
pnpm parity:api && pnpm vitest run packages/sqlite3
```
