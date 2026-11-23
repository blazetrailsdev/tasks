---
title: "sqlite3-test-raise-if-bind-params-not-an-array"
status: draft
updated: 2026-11-23
rfc: "0187-sqlite3-gem-port"
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

# sqlite3: port test_raise_if_bind_params_not_an_array (Ruby arity on execute/query/execute_batch)

## Context

`vendor/sqlite3/v2.7.3/test/test_statement.rb:491-503` asserts `ArgumentError` from
`@db.execute(sql, 1, 2)`, `@db.query(sql, 1, 2)` and `@db.execute_batch(sql, 1, 2)`. Ruby raises
from the VM's arity check (`argument_arity_error`, `vendor/ruby/v3.3.11/vm_args.c:800`): each
method takes `(sql, bind_vars = [], &block)` (`lib/sqlite3/database.rb:297` for `execute_batch`),
so a third positional is an arity error before the body runs.

In trails `Database#execute` / `#query` (`packages/sqlite3/lib/database.ts`) take the block as a
third positional parameter, so `execute(sql, 1, 2)` is rejected by TypeScript at compile time but
at run time hands `2` in as the block; the body then raises `SQLException` (no such table) instead.
`executeBatch` takes two parameters, so the extra argument is silently dropped.

Split from `sqlite3-test-statement-and-database-remainders`, which ported the rest. Needs an
operator decision: a runtime arity guard (e.g. `rbCheckArity`, `packages/ruby-compat/lib/method.ts:314`,
or a non-function block check) is an invented arm, while a PERMANENT-SKIP needs a ratified section.

## Acceptance criteria

- [ ] Operator rules on the mechanism (runtime guard vs. PERMANENT-SKIP citing a CLAUDE.md section).
- [ ] `raise if bind params not an array` is ported in `packages/sqlite3/test/test-statement.test.ts` accordingly, and `pnpm parity:test --package sqlite3 --missing` no longer lists it.
