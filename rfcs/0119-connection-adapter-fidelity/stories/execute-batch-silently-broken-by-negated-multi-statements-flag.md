---
title: "executeBatch is silently broken by a flags: ['-MULTI_STATEMENTS'] config (~70 LOC)"
status: draft
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split out of `mysql2-perform-query-ignores-its-batch-kwarg`, which was blocked in
PR #7536: node `mysql2` ships no way to send `COM_SET_OPTION`, so Rails'
`perform_query` batch bracketing
(`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql2/database_statements.rb:41-44`
and its `ensure` at `:105-108`) cannot be ported. `lib/constants/commands.js`
defines `SET_OPTION: 0x1b`, but there is no `Command` class for it in
`lib/commands/` and nothing in the public typings; `multipleStatements` is only
accepted at connect.

The blocked story's own text calls out a narrower half that is convergeable
regardless of that driver limitation, and it is what this story covers.

PR #7292 substituted an unconditional `multipleStatements: true` in
`Mysql2Adapter.newClient`
(`packages/activerecord/src/connection-adapters/mysql2-adapter.ts`). node
mysql2's `mergeFlags` honors a `-FLAG` blacklist against the default flag set
that `multipleStatements` pushes, so a user config of
`flags: ["-MULTI_STATEMENTS"]` silently defeats the flag. `executeBatch`
(`connection-adapters/mysql2/database-statements.ts`) then hands the driver a
`;`-separated payload the server will reject, with no diagnostic pointing at the
config that caused it.

Rails does not have this failure mode, because it turns the capability on per
batch rather than reading it off the connection's flags.

`isMultiStatementsEnabled`
(`connection-adapters/mysql2/database-statements.ts`, the port of
`multi_statements_enabled?` at `mysql2/database_statements.rb:31-38`) already
computes exactly the predicate needed here and currently has no consumer in
trails — Rails' only caller is the `perform_query` batch arm that cannot be
ported.

## Converged shape

Give `isMultiStatementsEnabled` back a caller by consulting it in
`executeBatch`'s path, so a connection whose flags disable multi-statements
fails loud instead of emitting a batch the server rejects. Rails' bare
`combine_multi_statements` has no such check because its caller has just turned
the capability on; trails cannot, so the honest options are to raise with a
message naming the `-MULTI_STATEMENTS` flag, or to fall back to issuing the
statements one at a time.

Pick whichever keeps `executeBatch`'s observable behaviour closest to Rails' and
justify it at the call site with the Rails `file:line`. Do not widen the
connect-time flag to paper over the config.

Note the truthiness/`fetch` traps: `_config.flags` may be an Array of strings, a
numeric bitmask, or absent, and the existing predicate already handles all three.

## Acceptance criteria

- [ ] `flags: ["-MULTI_STATEMENTS"]` does not silently yield a broken
      `executeBatch`.
- [ ] `isMultiStatementsEnabled` has a caller.
- [ ] `execute-batch.trails.test.ts` stays green, including its
      `multipleStatements: false` case, with a new arm covering the
      `-MULTI_STATEMENTS` config.
- [ ] MySQL and MariaDB lanes green (`ARCONN=mysql2`).
