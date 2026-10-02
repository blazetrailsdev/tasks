---
title: "activerecord: SQLite3 high_precision_current_timestamp returns a bare string, blocking InsertAll#timestamps_for_create"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8413. Rails (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3/database_statements.rb:46-51`):

    HIGH_PRECISION_CURRENT_TIMESTAMP = Arel.sql("STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')", retryable: true).freeze # :nodoc:
    private_constant :HIGH_PRECISION_CURRENT_TIMESTAMP

    def high_precision_current_timestamp
      HIGH_PRECISION_CURRENT_TIMESTAMP
    end

`packages/activerecord/src/connection-adapters/sqlite3/database-statements.ts#highPrecisionCurrentTimestamp` returns the bare JS string, with no constant, no `Arel.sql` and no `retryable: true`. `AbstractAdapter` declares the member `Nodes.SqlLiteral | string` to admit it.

This is what keeps `InsertAll#timestamps_for_create` (`vendor/rails/v8.0.2/activerecord/lib/active_record/insert_all.rb:221-223`, `model.all_timestamp_attributes_in_model.index_with(connection.high_precision_current_timestamp)`) from converging: `Builder#values_list` passes a value through only when it is a `Nodes.SqlLiteral`, so SQLite's string would be cast as a datetime and inserted as NULL. `packages/activerecord/src/insert-all.ts#timestampsForCreate` builds a `Time.now` in a loop instead; `activerecord-converge-invented-control-flow-arms-root-g-p-part-1` lists that row.

## Acceptance criteria

- [ ] SQLite's `highPrecisionCurrentTimestamp` returns the frozen `HIGH_PRECISION_CURRENT_TIMESTAMP` `Arel.sql(..., { retryable: true })` literal, and `AbstractAdapter`'s declaration is `Nodes.SqlLiteral`.
- [ ] `InsertAll#timestampsForCreate` is `indexWith(this.model.allTimestampAttributesInModel(), this.connection.highPrecisionCurrentTimestamp())`.
- [ ] `insert-all.test.ts` green on SQLite, PostgreSQL and MariaDB.
