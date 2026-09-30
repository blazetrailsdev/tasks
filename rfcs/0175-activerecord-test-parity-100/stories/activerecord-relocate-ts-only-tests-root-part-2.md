---
title: "activerecord: move the 174 TS-only tests in Rails-named root-part-2 test files to .trails siblings"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: extra-tests
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 650
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test` counts **1007 extra (TS only)** activerecord tests — tests in a Rails-mirroring
convention file that no Rails test consumed. The convention is that a TS-only test lives in the
`.trails.test.ts` sibling, so a Rails-named file holds only Rails' tests and its drift is visible.
This story's files (extras per file):

- `packages/activerecord/src/associations.test.ts` — 15
- `packages/activerecord/src/quoting.test.ts` — 13
- `packages/activerecord/src/query-logs.test.ts` — 13
- `packages/activerecord/src/serialized-attribute.test.ts` — 12
- `packages/activerecord/src/explain.test.ts` — 12
- `packages/activerecord/src/query-cache.test.ts` — 9
- `packages/activerecord/src/transactions.test.ts` — 7
- `packages/activerecord/src/inheritance.test.ts` — 6
- `packages/activerecord/src/database-configurations.test.ts` — 6
- `packages/activerecord/src/suppressor.test.ts` — 6
- `packages/activerecord/src/attribute-methods.test.ts` — 5
- `packages/activerecord/src/fixtures.test.ts` — 5
- `packages/activerecord/src/migration.test.ts` — 5
- `packages/activerecord/src/modules.test.ts` — 5
- `packages/activerecord/src/enum.test.ts` — 4
- `packages/activerecord/src/reflection.test.ts` — 4
- `packages/activerecord/src/primary-keys.test.ts` — 4
- `packages/activerecord/src/transaction-callbacks.test.ts` — 4
- `packages/activerecord/src/json-serialization.test.ts` — 4
- `packages/activerecord/src/connection-pool.test.ts` — 3
- `packages/activerecord/src/aggregations.test.ts` — 3
- `packages/activerecord/src/delegated-type.test.ts` — 3
- `packages/activerecord/src/test-databases.test.ts` — 3
- `packages/activerecord/src/insert-all.test.ts` — 2
- `packages/activerecord/src/locking.test.ts` — 2
- `packages/activerecord/src/active-record-schema.test.ts` — 2
- `packages/activerecord/src/cache-key.test.ts` — 2
- `packages/activerecord/src/touch-later.test.ts` — 2
- `packages/activerecord/src/connection-management.test.ts` — 2
- `packages/activerecord/src/inherited.test.ts` — 2
- `packages/activerecord/src/finder.test.ts` — 1
- `packages/activerecord/src/schema-dumper.test.ts` — 1
- `packages/activerecord/src/dirty.test.ts` — 1
- `packages/activerecord/src/core.test.ts` — 1
- `packages/activerecord/src/dup.test.ts` — 1
- `packages/activerecord/src/bind-parameter.test.ts` — 1
- `packages/activerecord/src/database-selector.test.ts` — 1
- `packages/activerecord/src/normalized-attribute.test.ts` — 1
- `packages/activerecord/src/reaper.test.ts` — 1

## Acceptance criteria

- [ ] Each extra is (a) a Rails test under a drifted name or describe path → matched to Rails' name/path (never renaming a Rails-named test); (b) a duplicate of a ported Rails test → deleted; or (c) genuinely TS-only → moved to the `.trails.test.ts` sibling unchanged.
- [ ] The files above report 0 extra in `pnpm parity:test`.

## Verification

```bash
pnpm parity:test --package activerecord --sort-extra --min-extra=1
```
