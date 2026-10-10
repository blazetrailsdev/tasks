---
title: "activerecord: five added arms that look like language limits need convergence or an owner ruling"
status: draft
updated: 2026-10-10
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: ["activerecord", "arel"]
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

trails#8740 left five arms or calls the port adds to Rails' body that look like TypeScript language
limits. None is ratified in CLAUDE.md, so each is receipted `CONVERGEABLE` against this story until
the repo owner rules or the arm is converged away:

- `transaction` (`packages/activerecord/src/connection-adapters/abstract/database-statements.ts`),
  `@inventedArm if` / `throw`: raises `ArgumentError` for an unknown option key, which Ruby's keyword
  arguments raise for free at
  `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:352`.
  Rails' "invalid keys for transaction" test (`activerecord/test/cases/transactions_test.rb`) asserts it.
- `quote` (`connection-adapters/sqlite3/quoting.ts`), `@inventedArm if`: `value.finite?`
  (`sqlite3/quoting.rb:53-64`) is asked of a JS number or a `BigDecimal` through a ternary. A
  ruby-compat `Numeric#finite?` would remove it.
- `checkConstraints` (`connection-adapters/sqlite3/schema-statements.ts`), `@inventedArm loop` / `if`:
  Rails scans with a recursive regex, `\g<expression>` (`sqlite3/schema_statements.rb` `check_constraints`).
  JS `RegExp` has no subexpression call, so the port balances parentheses by hand.
- `sql` (`packages/arel/src/arel.ts`), `@inventedArm if`: `**named_binds` and `retryable:` are split
  off the tail of `*positional_binds` (`vendor/rails/v8.0.2/activerecord/lib/arel.rb:52-58`).
- `DatabaseTasks.env` (`packages/activerecord/src/tasks/database-tasks.ts`), `@inventedArm toString`:
  Rails memoizes `Rails.env` itself (`tasks/database_tasks.rb:99-105`). `EnvironmentInquirer` is an
  object in trails, so memoizing it breaks `env === "test"` and `configurations[env]` at every reader.

## Acceptance criteria

- [ ] Each of the five is converged, or ruled permanent by the repo owner and ratified in CLAUDE.md,
      after which its receipt reads `PERMANENT`.
- [ ] No `@inventedArm ... CONVERGEABLE` receipt names this story.
