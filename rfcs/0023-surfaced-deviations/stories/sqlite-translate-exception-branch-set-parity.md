---
title: "Converge SQLite translateException branch set to Rails"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "merged into sqlite3-translate-exception-branch-set (same method / same subsystem; all Rails file:line citations carried into the surviving body)"
---

## Context

Surfaced while converging `isNoDatabaseError` away (PR #5883).
`translateException` in
`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts` diverges from
Rails' `SQLite3Adapter#translate_exception`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:692`)
in two ways:

- trails has a `String or BLOB exceeded size limit` -> `ValueTooLong` branch that
  Rails does not have.
- trails is missing Rails' `exception.is_a?(::SQLite3::BusyException)` ->
  `StatementTimeout` branch (`sqlite3_adapter.rb:706`).

Rails' branch list, in order: unique, not-null, FK, closed-database, busy, else
`super`. trails' order also differs (closed-database sits after the extra
`ValueTooLong` arm).

## Acceptance criteria

- trails' `translateException` branch set and order match
  `sqlite3_adapter.rb:692`-`:709` exactly.
- The `ValueTooLong` arm is removed, or justified at the call site with the
  driver evidence that makes it unavoidable.
- A busy/locked driver error maps to `StatementTimeout`.
- No test name renamed.
