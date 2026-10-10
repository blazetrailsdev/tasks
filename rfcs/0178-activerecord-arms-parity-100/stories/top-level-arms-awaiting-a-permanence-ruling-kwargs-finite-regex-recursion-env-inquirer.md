---
title: "activerecord: connection.transaction and Arel.sql split and check keyword arguments by hand"
status: in-progress
updated: 2026-10-10
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: ["activerecord", "arel"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8760
claim: "2026-10-10T17:09:39Z"
assignee: "load-async-null-executor-arm-floats-its-load-under-the-adapter-lock"
blocked-by: null
closed-reason: null
---

## Context

Two ports do by hand what Ruby's keyword arguments do in the method header. Each carries
`@inventedArm ... CONVERGEABLE` against this story (from trails#8740):

- `transaction` (`packages/activerecord/src/connection-adapters/abstract/database-statements.ts`),
  `@inventedArm if` / `throw`. Rails is `def transaction(requires_new: nil, isolation: nil, joinable: true, &block)`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:352`),
  and an unknown key raises `ArgumentError: unknown keyword: :nested` from MRI's `rb_get_kwargs`
  (`vendor/ruby/v3.3.11/class.c:2413`). Rails' "invalid keys for transaction" test
  (`activerecord/test/cases/transactions_test.rb`) asserts it. The port destructures the options,
  collects the rest, and raises with an `if` and a singular/plural ternary of its own.
- `sql` (`packages/arel/src/arel.ts`), `@inventedArm if`. Rails is
  `def self.sql(sql_string, *positional_binds, retryable: false, **named_binds)`
  (`vendor/rails/v8.0.2/activerecord/lib/arel.rb:52-58`). The port inspects the last element of
  `positionalBinds`, pops it when it is a plain object, and splits `retryable` from the rest.

## Convergence mechanism

One ruby-compat entry point per fact, so neither body carries the arm:

- `rbGetKwargs(keywordHash, table)` for `rb_get_kwargs`: given the option object and the names the
  header declares, it raises `ArgumentError` with MRI's `unknown keyword` / `unknown keywords` text.
  `transaction` calls it once and keeps Rails' two-branch body.
- A splat-then-keywords splitter for `rb_scan_args`' trailing-hash rule
  (`vendor/ruby/v3.3.11/class.c`, `rb_scan_args_parse`): it returns the positional list and the keyword
  hash. `Arel.sql` calls it and destructures `retryable` from the result.

## Acceptance criteria

- [ ] Both ruby-compat functions exist with `@noRailsEquivalent PERMANENT` and an MRI citation, and
      each has a call site.
- [ ] `transaction` and `Arel.sql` call them and carry no `@inventedArm if` / `throw` receipt naming
      this story. Their added call takes an `@inventedArm <name>` receipt only if the arms report
      still files it.
- [ ] "invalid keys for transaction" and the arel `sql` tests green.
