---
title: "activerecord: PostgreSQL escape_bytea escapes without reading valid_raw_connection"
status: blocked
updated: 2026-10-08
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: "The story's own fallback criterion. escape_bytea (postgresql/quoting.rb:70-72) is reached from the synchronous quoted_binary under quote, and validRawConnection() answers a promise on an unverified connection, so the port cannot await it. Its sibling pg-quote-string-escapes-without-with-raw-connection was closed PERMANENT under CLAUDE.md section 'Adapter facts are prewarmed and peeked' (trails#8685), but that section names lookup_cast_type, max_identifier_length and quote_string only, not escape_bytea. Unblocks when the owner extends the section to escape_bytea or decides another shape. Body drift: on origin/main escapeBytea (postgresql/quoting.ts:50) is still the inline hex escaper; the Connection.escapeBytea form the body quotes is from the unmerged trails#8687."
closed-reason: null
---

## Context

`escapeBytea` in `packages/activerecord/src/connection-adapters/postgresql/quoting.ts` is
`if (value != null) return Connection.escapeBytea(value)`, the pg gem's singleton
`PG::Connection.escape_bytea` (`vendor/pg/v1.5.9/ext/pg_connection.c:4486`). Rails calls the
instance method on the live connection:
`valid_raw_connection.escape_bytea(value) if value`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/quoting.rb:70-72`).

`valid_raw_connection` (`abstract_adapter.rb`, trails `AbstractAdapter#validRawConnection`) answers a
promise when the connection is not verified yet, and `escape_bytea` is reached from the synchronous
`quoted_binary` under `quote` (`quoting.rb`, `quotedBinary` in the same trails file). So the port
cannot await the connection there. The call gate does not flag the omission, so no
`@missingRailsCall` receipt can sit on it (one reads stale under `parity:api:receipts:gate`).

Same wall as `pg-quote-string-escapes-without-with-raw-connection` (blocked), which is
`quote_string`'s `with_raw_connection`.

## Acceptance criteria

- [ ] `escapeBytea` reads the connection through `validRawConnection()` and calls the instance
      `escapeBytea` on it, as `quoting.rb:70-72` does, or this story is blocked on the same decision
      as `pg-quote-string-escapes-without-with-raw-connection`.
- [ ] `quotedBinary` keeps working on an adapter that has not connected yet.
