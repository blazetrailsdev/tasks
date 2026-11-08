---
title: "activerecord: PG Timestamp decoder takes pg's mktime fast path and ports TimestampUtcToLocal"
status: draft
updated: 2026-11-08
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pg_text_dec_timestamp` (`vendor/pg/v1.5.9/ext/pg_text_decoder.c:738-751`) takes its
`rb_time_timespec_new` fast path for a timestamp with no offset under
`TIMESTAMP_DB_LOCAL` too, converting through `mktime`. trails' `Timestamp#decode`
(`packages/activerecord/src/connection-adapters/postgresql/pg-text-decoder.ts`, the
`local` guard added in trails#9860) sends that case to the `Time.new` slow path,
because `Date.UTC` has no local-time counterpart. The answer is the same, but the
branch structure differs from C.

Also, `PG::TextDecoder::TimestampUtcToLocal`
(`vendor/pg/v1.5.9/lib/pg/text_decoder/timestamp.rb:13-18`, flags
`TIMESTAMP_DB_UTC | TIMESTAMP_APP_LOCAL`) is not ported. Only `TimestampUtc` and
`TimestampLocal` exist, and the test builds a test-only subclass to reach the
`APP_LOCAL` arm.

## Acceptance criteria

- The DB_LOCAL, no-offset case takes the `Time.timespecNew` path, with the epoch
  computed by a local-time conversion that is the `mktime` analogue
  (`Temporal.PlainDateTime#toZonedDateTime` in the system zone). It falls back to
  `Time.new` only where `mktime` would fail.
- `TimestampUtcToLocal` is exported from `PGTextDecoder` with pg's flags, and the
  equivalence test in `pg-text-decoder.trails.test.ts` uses it in place of the
  test-only subclass.
- The equivalence test (fingerprint against `Time.new`) still passes for every coder.
