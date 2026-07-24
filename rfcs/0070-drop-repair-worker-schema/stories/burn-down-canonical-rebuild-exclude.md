---
title: "burn-down-canonical-rebuild-exclude"
status: claimed
updated: 2026-07-24
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-24T22:06:55Z"
assignee: "burn-down-canonical-rebuild-exclude"
blocked-by: null
closed-reason: null
---

## Context

`require-canonical-rebuild` (eslint/require-canonical-rebuild.mjs) flags a test
file that drops a canonical table — a `TEST_SCHEMA` key — without restoring it
via `rebuildCanonicalTables` / `loadCanonicalSchema`. It shipped with
`eslint/require-canonical-rebuild-exclude.json` holding 20 AR test files: some
own a private `:memory:` adapter (legitimately exempt — they never touch the
shared per-worker database), the rest are a real backlog of files that drop a
canonical table on the shared DB and leave it dropped, which
`repairWorkerSchema` (`packages/activerecord/src/test-helpers/schema-repair.ts`)
then has to repair for the next file.

The non-`:memory:` entries (no `:memory:` occurrence in the file at all) are:

- `packages/activerecord/src/adapters/abstract-mysql-adapter/active-schema.test.ts`
- `packages/activerecord/src/adapters/postgresql/schema.test.ts`
- `packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.test.ts`
- `packages/activerecord/src/connection-adapters/sqlite3-adapter.transactions.test.ts`
- `packages/activerecord/src/connection-adapters/sqlite3-introspection.test.ts`
- `packages/activerecord/src/migration.test.ts`
- `packages/activerecord/src/schema-dumper.test.ts` (7 drops — the largest)

## Acceptance criteria

- Each listed file either restores every canonical table it drops (a
  `rebuildCanonicalTables(adapter, [...])` after the drop) or stops dropping it.
- Its entry is removed from `eslint/require-canonical-rebuild-exclude.json` and
  `npx eslint <file>` is clean.
- `:memory:`-only files stay in the exclude list — they are a permanent
  exemption, not backlog; consider a comment distinguishing the two groups.
- Split across PRs if it exceeds the 500-LOC ceiling.
