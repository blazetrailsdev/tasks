---
title: "fix-parity-node-dump-runners"
status: in-progress
updated: 2026-07-24
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5264
claim: "2026-07-24T20:22:53Z"
assignee: "fix-parity-node-dump-runners"
blocked-by: null
closed-reason: null
---

# Parity node dump runners are bit-rotted — 8 integration tests fail

## Context

`scripts/parity/query/node/dump.test.ts` and
`scripts/parity/query/node/ar_dump.test.ts` are the only compare/parity script
suites left out of CI by #<this PR> (compare-script-tests-in-ci), because they
fail today even with `pnpm build` run first:

- `dump.ts:161` does `arel.Table.engine = { connection: { visitor: new
arel.Visitors.SQLite() } }`. Since RFC 0007 deleted the connection-less
  quoters, `ToSql` resolves `this.connection.quoteTableName` (see
  `packages/arel/src/visitors/to-sql.ts:1665-1667`) and the visitor is
  constructed with no connection, so every dump dies with
  "Cannot read properties of undefined (reading 'quoteTableName')".
  6 of 8 tests in dump.test.ts fail.
- `ar_dump.ts` fails with "The `/tmp/parity-ar-node-XXXX/query.db` database is
  not configured for the `development` environment. Available database
  configurations are: (none)" on the two tests that actually evaluate a
  fixture (ar-06, ar-65) — the establish_connection shape it passes no longer
  matches AR's config resolution. The three arg-validation tests pass.

Rails' side sets up the equivalent via `establish_connection adapter:
"sqlite3"`; the trails runners need connection doubles that carry real
quoting (compare `packages/arel/src/test-helpers/connection.ts`'s
`fakeRecordEngine`, which the arel suite installs via
`test-setup-engine.ts` — note that double quotes booleans as `'t'`/`'f'`, so
it is NOT the right double for a SQLite-adapter-faithful parity dump).

These runners are also invoked by the label/schedule-gated
`query-parity-trails` job, so the bit-rot likely means that job is red too.

## Acceptance criteria

- `pnpm vitest run scripts/parity/query/node` passes after `pnpm build`.
- The runners compile through a connection that mirrors the Rails side's
  `sqlite3` adapter quoting, not an ad-hoc stub.
- `scripts/parity/query/node` is added back to the `unit-tests` job's vitest
  invocation in `.github/workflows/ci.yml` (with whatever build step it needs)
  or to a job that already builds, and the comment listing it as a deliberate
  omission is removed.
