---
title: "converge-database-tasks-register-base-onto-base-slot"
status: ready
updated: 2026-09-23
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 8
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left over from `converge-resolver-registry-permanent-receipts` (trails#7990). The same pattern survives in two more places:

- `packages/activerecord/src/tasks/database-tasks.ts:31-39` has a module-level `_base` plus `setModuleBase` / `baseClass()`, which throws an invented `ActiveRecordError("ActiveRecord::Base has not finished loading")`. `DatabaseTasks._registerBase` (`:880-883`, `@internal`, no Rails counterpart) populates it, and `base.ts` calls it (`DatabaseTasks._registerBase(Base)`). Rails reads the constant directly: `ActiveRecord::Base` in `tasks/database_tasks.rb` (e.g. `migration_class`, `database_tasks.rb` `def migration_class; ActiveRecord::Base; end`).
- `packages/activerecord/src/migration.ts:1488` uses `await import("./base.js")` to read `Base.protectedEnvironments`, where Rails reads `ActiveRecord::Base.protected_environments` (`migration.rb`, `check_protected_environments!` / `protected_environment?`).

Both should read `_Base` from the listed `activerecord/src/base-slot.ts` (CLAUDE.md § Call-time constant resolution). A slot read carries no guard.

## Acceptance criteria

- `DatabaseTasks._registerBase`, `setModuleBase`, the module `_base` and its throw are deleted, and readers use `_Base!` from `base-slot.ts`.
- `migration.ts`'s dynamic `import("./base.js")` is replaced by a `_Base!` read.
- `base.ts` no longer calls `DatabaseTasks._registerBase`.
- `pnpm parity:api:calls`, `:calls:args` and `:extra:gate` stay green.
