---
title: "substitute-binds-invents-preparable-retryable-defaults"
status: done
updated: 2026-08-28
rfc: "0124-arel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7144
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Sibling of `sql-string-invents-preparable-retryable-defaults` and
`bind-collector-invents-retryable-default`, both converged in the PR that
closes them (RFC 0124).

`Arel::Collectors::SubstituteBinds` declares `attr_accessor :preparable,
:retryable` (`vendor/rails/activerecord/lib/arel/collectors/substitute_binds.rb:6`)
and `initialize` sets only `@quoter` / `@delegate` (substitute_binds.rb:8-11),
so a fresh `SubstituteBinds` has `preparable == nil` and `retryable == nil`.

`packages/arel/src/collectors/substitute-binds.ts:4-5` invents
`preparable = false` and `retryable = true`.

The invented `retryable = true` is load-bearing: `compileInlined` in
`packages/activerecord/src/connection-adapters/abstract/database-statements.ts:174-185`
constructs a `SubstituteBinds` and returns `collector.retryable` without ever
writing it, where Rails' `to_sql_and_binds` seeds `collector.retryable = true`
before compiling, for BOTH the prepared and the unprepared branch
(`abstract/database_statements.rb:29-30`).

`#addBind` / `#addBinds` also take the block optionally / not at all where
substitute_binds.rb:17,21 take a block (`&`); the block is unused in both
bodies, matching the required-parameter shape `SQLString` and `Bind` now have.

## Acceptance criteria

- `SubstituteBinds#preparable` and `#retryable` have no initializer
  (`preparable?: boolean` / `retryable?: boolean`), mirroring
  substitute_binds.rb:6.
- `compileInlined` seeds `collector.retryable = true` before compiling, as
  database_statements.rb:30 does, so its returned `allow_retry` keeps Rails'
  value.
- `#addBind` / `#addBinds` take a required block parameter.
- `collectors/substitute-binds.test.ts` and the
  `connection-adapters/abstract/database-statements` tests stay green; no test
  renamed.
