---
title: "Give the seven abstract DatabaseStatements members real bodies in their own file and drop the optional-member guards Rails does not have"
status: draft
updated: 2026-08-31
rfc: "0000-activemodel-activerecord-api-parity-100"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: 320
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`connection_adapters/abstract/database_statements.rb` sits at 76/83, with seven
declaration-only misses: `insert`, `create`, `within_new_transaction`,
`current_transaction`, `dirty_current_transaction`, `cast_result` and
`affected_rows`.

Rails defines all seven in that file
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb`
— `insert`, `create` as its alias, `within_new_transaction`,
`current_transaction`, `dirty_current_transaction`, `cast_result`,
`affected_rows`).

trails declares them on the host interface as **optional** members
(`packages/activerecord/src/connection-adapters/abstract/database-statements.ts:102`
`dirtyCurrentTransaction?`, `:115` `castResult?`, `:117` `affectedRows?`,
`:121` `currentTransaction?`, `:127` `withinNewTransaction?`) and calls them
defensively (`:388`, `:414`, `:757`, `:999`). `insert` and `affectedRows`
appear as bodied entries in the module map at `:1019` and `:1085`, so the file
is partly right already.

Two distinct problems, both in scope:

1. The optional `?` is a divergence from Rails, where the base class defines a
   real body every adapter inherits. Every `this.castResult ? … : …` guard at a
   call site exists only because the seat was made optional.
2. The base bodies belong in this file, not spread across adapters.

`create` is Rails' `alias create insert` and ports as the same body under both
names, not as a wrapper.

## Acceptance criteria

- All seven carry real bodies in
  `connection-adapters/abstract/database-statements.ts`, matching the Rails
  bodies line for line, and the host-interface members lose their `?`.
- The defensive `this.x?.()` / `this.x ? … : …` call sites in that file are
  rewritten to the plain calls Rails makes — an optional-chained call is a
  guard Rails does not have.
- activerecord `connection_adapters/abstract/database_statements.rb` reaches
  **83/83**; package total rises by 7.
- All five adapter lanes pass; `pnpm parity:api:calls` and `:calls:args` clean.
