---
title: "pg: the wrapper raises PG::Error subclasses carrying a PG::Result; translate_exception reads error_field"
status: draft
updated: 2026-10-08
rfc: "0186-pg-gem-port"
cluster: connection
packages: ["pg", "activerecord"]
deps: ["pg-connection-exec-surface-moves-to-the-package"]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `translate_exception` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:800-848`) opens with
`return exception unless exception.respond_to?(:result)` and switches on
`exception.result.try(:error_field, PG::PG_DIAG_SQLSTATE)` (`:804`), with an
`exception.is_a?(PG::ConnectionBad)` arm (`:808`). `is_cached_plan_failure?` (`:900-906`) reads
`pgerror.result.result_error_field(PG::PG_DIAG_SQLSTATE)` and `PG_DIAG_SOURCE_FUNCTION`.
`exec_prepared`'s rescue is `PG::FeatureNotSupported` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/database_statements.rb:142`).

node-pg raises a bare `Error` for connection-level failures and pg-protocol's `DatabaseError`
(fields `code`, `routine`, `severity`, `message`, ...) for server errors. That is the recorded
blocker of `pg-translate-exception-respond-to-result` (RFC 0178, blocked): "node-pg errors share
no class, marker or result carrier".

Gem: `PG::Error#result` / `#connection` (`vendor/pg/v1.5.9/ext/pg_errors.c:84-85`); the class raised for a
server error is looked up by SQLSTATE (`vendor/pg/v1.5.9/ext/errorcodes.def`, falling back to the two-char
class, then `PG::ServerError`); `Result#error_field` `vendor/pg/v1.5.9/ext/pg_result.c:1714`,
`result_error_field` alias `:1715`.

## Acceptance criteria

- [ ] Every promise the engine returns rejects with a `PG::Error`: a `DatabaseError` becomes the SQLSTATE's class where the package defines it (`FeatureNotSupported` for `0A000`) and `PG::ServerError` otherwise, with `result` set to a `PG.Result` in error state; a connection-level failure becomes `PG::ConnectionBad` (or `PG::UnableToSend` where libpq raises that), with `result` nil and `connection` set. The node-pg error is kept as `cause`.
- [ ] `PG.Result#errorField(fieldcode)` and `resultErrorField` answer `PG_DIAG_SQLSTATE`, `PG_DIAG_SOURCE_FUNCTION`, `PG_DIAG_MESSAGE_PRIMARY`, `PG_DIAG_SEVERITY` from the `DatabaseError`'s `code`, `routine`, `message`, `severity`, and nil for any other code.
- [ ] `translateException` is `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:800-848` branch for branch, including `respond_to?(:result)` (as `rbObjRespondTo`) and the `ConnectionBad` arm; no `error.code` read and no message matching remain in it.
- [ ] `isCachedPlanFailure` and the `exec_prepared` rescue name `PG::FeatureNotSupported` / `result_error_field` as Rails does.
- [ ] The package defines only the SQLSTATE classes trails names (rule 1). Adding one later is a one-line row; the README says so.
- [ ] `pg-translate-exception-respond-to-result` is unblocked: this PR's body says so and names the verb (`tasks status-set ... ready`) for the owner to run; its `@missingRails*` receipts are removed here if this story closes them.

## Verification

```bash
pnpm vitest run packages/pg packages/activerecord/src/connection-adapters/postgresql && pnpm parity:api:arms:throws
```

## Notes

Assertions on `error.code` elsewhere in activerecord tests keep working through `cause`; do not
add a `code` reader to `PG::Error`, the gem has none.
