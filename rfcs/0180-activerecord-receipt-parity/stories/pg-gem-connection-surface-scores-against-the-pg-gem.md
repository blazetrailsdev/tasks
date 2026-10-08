---
title: "activerecord: the PG::Connection wrapper scores against the pg gem"
status: done
updated: 2026-10-08
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: trails#8687
claim: "2026-10-08T17:05:11Z"
assignee: "pg-gem-connection-surface-scores-against-the-pg-gem"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/connection-adapters/postgresql/pg-connection.ts` carries the pg gem's
`PG::Connection` surface over the `pg` npm client: `prepare`, `exec_prepared`, `async_exec`,
`exec_params` and `unescape_bytea`, installed on the client by `pgConnection()` from
`PostgreSQLAdapter`'s `_rawConnection` setter. It was added so
`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/database_statements.rb:160-193`
(`perform_query`), `postgresql/quoting.rb:77-79` (`unescape_bytea`) and `postgresql/oid/bytea.rb:8-12`
could take Rails' control flow.

The pg gem is not vendored, so the file has no Ruby counterpart to score against: `pgConnection` and
the module-level `unescapeBytea` (`PG::Connection.unescape_bytea`) carry
`@noRailsEquivalent CONVERGEABLE` receipts pointing here. The rest of the gem's connection surface is
still open-coded elsewhere:

- `postgresql-adapter.ts` `_attachReadyForQueryListener` assigns `transactionStatus`, `status`,
  `cancel` and `block` onto the client by hand (`PG::Connection#transaction_status`, `#status`,
  `#cancel`, `#block`, read at `database_statements.rb:127-132` and `postgresql_adapter.rb`).
- `postgresql/quoting.ts` `escapeBytea` is `PQescapeByteaConn` written inline and takes no
  connection, where `quoting.rb:70-72` is `valid_raw_connection.escape_bytea(value) if value`.
- `postgresql/pg-result.ts` is the same shape for `PG::Result`, tracked by
  `pg-gem-result-and-array-coders-score-against-the-pg-gem`.

## Acceptance criteria

- [ ] The pg gem's connection surface lives in one place, shaped so `parity:api` can score it against
      the pg gem (vendor the gem's Ruby surface, or move the wrapper to a package that mirrors it).
- [ ] `transactionStatus`, `status`, `cancel` and `block` are defined with the rest of that surface,
      not assigned in `_attachReadyForQueryListener`.
- [ ] `escapeBytea` is `valid_raw_connection.escape_bytea(value) if value`, delegating to the wrapper.
- [ ] The two `@noRailsEquivalent CONVERGEABLE` receipts in `pg-connection.ts` are gone.
