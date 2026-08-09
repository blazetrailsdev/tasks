---
title: "schemaConn seeds MySQL's protected _databaseVersion to warm version gates"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "trails test-support plumbing (support/schema-conn.ts seeding a version for unconnected DDL unit tests); no Rails behaviour is diverging."
---

## Context

`packages/activerecord/src/support/schema-conn.ts` hands DDL-rendering unit tests a
real adapter that is constructed but never connected. PR #5944 had to seed the MySQL
one's protected `_databaseVersion` with `new Version("8.0.35")`, because
`supports_check_constraints?` (`>= 8.0.16`) and `supports_index_sort_order?`
(`>= 8.0.1`) read the cached version synchronously
(`connection-adapters/abstract-mysql-adapter.ts:441,475`) and answer `false` when it
is cold — silently rendering pre-8.0 DDL.

Reaching into a protected field from test support is a trails invention: Rails' tests
hand `SchemaCreation.new` a leased connection whose version is real. The seeded
constant also drifts from whatever the CI MySQL/MariaDB service actually runs, so a
version-gated branch can pass locally and diverge on a real lane.

## Acceptance criteria

- The MySQL `schemaConn` adapter reports a version without a test-support write to a
  protected field — e.g. a supported public warm-up, or the version-gated flags read
  through a path that does not require a live connection.
- No behavior change in the DDL these unit tests render.
- Docs/comment in `schema-conn.ts` states where the version comes from.
