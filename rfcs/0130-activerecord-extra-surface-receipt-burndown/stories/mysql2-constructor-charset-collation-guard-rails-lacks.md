---
title: "Mysql2Adapter constructor validates charset/collation; Rails does not"
status: draft
updated: 2026-09-16
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Mysql2Adapter`'s constructor
(`packages/activerecord/src/connection-adapters/mysql2-adapter.ts:250-258`)
validates `charset` and `collation` against a `SAFE_CHARSET_RE` of
`/^[A-Za-z0-9_]+$/` and raises a bare `Error` when either fails:

```ts
const _charset = mysqlConfig.charset ?? (mysqlConfig as { encoding?: string }).encoding;
const _collation = (mysqlConfig as { collation?: string }).collation;
const SAFE_CHARSET_RE = /^[A-Za-z0-9_]+$/;
if (_charset && !SAFE_CHARSET_RE.test(_charset)) {
  throw new Error(`Invalid MySQL charset: ${JSON.stringify(_charset)}`);
}
if (_collation && !SAFE_CHARSET_RE.test(_collation)) {
  throw new Error(`Invalid MySQL collation: ${JSON.stringify(_collation)}`);
}
```

Rails' `Mysql2Adapter#initialize`
(`activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb:55-67`)
does none of this. Its whole body is `super`, then
`@affected_rows_before_warnings = nil`, the `@config[:flags]` FOUND_ROWS
normalisation, and `@connection_parameters ||= @config`. It never reads
`:charset` or `:collation` and never validates them; the values reach the driver
as configured.

Everything about the trails block is invented: the two `_`-prefixed locals, the
`SAFE_CHARSET_RE` constant, the regexp, the raise sites, and the bare `Error`
class (Rails raises `ActiveRecord::` errors, never a bare one).

The sibling of this guard in `mysql/schema_creation.rb`'s
`add_table_options!` / `add_column_options!` path was removed in trails#7825 for
the same reason — Rails interpolates `charset` and `collation` raw there
(`mysql/schema_creation.rb:56-77`). This is the last instance of the pattern.

Note the trust boundary before converging: these values come from
`database.yml`-equivalent connection config, which is developer-authored, the
same source Rails reads without validating.

Related, already tracked: `savepoint-name-validator-is-a-guard-rails-does-not-have`,
`pg-schema-statements-bare-error-throws-and-invented-guards`,
`converge-pg-session-variables-config-validation`.

## Acceptance criteria

- The `SAFE_CHARSET_RE` constant, the `_charset` / `_collation` locals and both
  `throw new Error` arms are deleted from the `Mysql2Adapter` constructor.
- The constructor body matches `mysql2_adapter.rb:55-67` — `super`, the
  `affectedRowsBeforeWarnings` reset, the FOUND_ROWS flag normalisation, and the
  connection-parameters default — with nothing between them that Rails does not
  have.
- Any test asserting `/Invalid MySQL charset/` is retired with the guard, not
  rewritten to assert a different invented message
  (`abstract-mysql-adapter.configure-connection.trails.test.ts:66` is the one
  that exists today).
- `pnpm parity:api:calls` / `:args` gain no rows; `parity:api:extra:gate` stays
  at activerecord `novel 0/0, total 0/0 (rowless)`.

## Why this RFC

Filed under 0130 because no better-fitting RFC is active: 0119
(connection-adapter fidelity) is closed, 0094 is scoped to the SQLite3
constructor's root cause, and activerecord has no `-surfaced-deviations` bucket
(0023 is retired as the catch-all). Rehome if an adapter-fidelity RFC reopens.
