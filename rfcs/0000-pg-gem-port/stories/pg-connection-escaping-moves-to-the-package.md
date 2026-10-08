---
title: "pg: escape_bytea, unescape_bytea, quote_ident and escape are PG::Connection methods"
status: draft
updated: 2026-10-08
rfc: "0000-pg-gem-port"
cluster: connection
packages: ["pg", "activerecord"]
deps: ["pg-connection-exec-surface-moves-to-the-package"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `packages/activerecord/src/connection-adapters/postgresql/quoting.ts:50-53` `escapeBytea` is `PQescapeByteaConn` inline and takes no
  connection; Rails is `valid_raw_connection.escape_bytea(value) if value`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/quoting.rb:70-72`).
- `packages/activerecord/src/connection-adapters/postgresql/pg-connection.ts:98-126` `unescapeBytea` carries a `@noRailsEquivalent
CONVERGEABLE pg-gem-connection-surface-scores-against-the-pg-gem` receipt; Rails calls the
  instance form at `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/quoting.rb:78` and the singleton at `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/oid/bytea.rb:11`.
- `packages/activerecord/src/connection-adapters/postgresql/utils.ts:20` is an inline lambda for `PG::Connection.quote_ident`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/utils.rb:24,26`, `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/quoting.rb:47`).
- `quoteString` open-codes `connection.escape(s)` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/quoting.rb:127-131`) under
  `@missingRailsCall with_raw_connection — CONVERGEABLE pg-quote-string-escapes-without-with-raw-connection`
  (`packages/activerecord/src/connection-adapters/postgresql/quoting.ts:111`); that story is blocked.

Gem, `vendor/pg/v1.5.9/ext/pg_connection.c`: singleton `escape_string` `:4484` (+ `escape` `:4485`),
`escape_bytea` `:4486`, `unescape_bytea` `:4487`, `quote_ident` `:4489`; instance
`escape_string` `:4556`, `escape` alias `:4557`, `escape_bytea` `:4560`, `unescape_bytea` `:4561`.
All are pure in the wrapper: no I/O, synchronous.

## Acceptance criteria

- [ ] `PG.Connection` has static and instance `escapeBytea`, `unescapeBytea`, `escapeString` / `escape`, and static `quoteIdent`, each one body shared by its two forms as the C shares `pgconn_s_*`.
- [ ] `packages/activerecord/src/connection-adapters/postgresql/utils.ts` and `quoting.ts`'s `quoteColumnName` / `quoteTableName` call `PG.Connection.quoteIdent`; the inline lambda is gone.
- [ ] `packages/activerecord/src/connection-adapters/postgresql/oid/bytea.ts` calls `PG.Connection.unescapeBytea`; `quoting.ts`'s `unescapeBytea` calls the instance form.
- [ ] `escapeBytea` and `quoteString` call the package. WHICH form (instance through `valid_raw_connection` / `with_raw_connection`, or singleton with a receipt) is RFC 0000-pg-gem-port open question 2: do not start this criterion until it is answered, and implement exactly the answer.
- [ ] `pg-connection.ts` and both of its receipts are deleted.
- [ ] `escape_bytea` output is pinned against libpq's for the empty string, a NUL byte, 0x5c and 0xff, in `packages/pg`.

## Verification

```bash
pnpm vitest run packages/pg packages/activerecord/src/connection-adapters/postgresql && pnpm parity:api:receipts:gate
```

## Notes

`PG::Connection.quote_ident` raises on a string containing a NUL byte and accepts an Array
(`pgconn_s_quote_ident`); port both arms, node-pg's `escapeIdentifier` has neither.
