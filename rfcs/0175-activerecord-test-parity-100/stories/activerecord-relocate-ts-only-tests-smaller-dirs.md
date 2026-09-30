---
title: "activerecord: move the 66 TS-only tests in Rails-named smaller-dirs test files to .trails siblings"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: extra-tests
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 324
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

- `packages/activerecord/src/adapters/abstract-mysql-adapter/connection.test.ts` — 7
- `packages/activerecord/src/adapters/abstract-mysql-adapter/mysql-explain.test.ts` — 7
- `packages/activerecord/src/migration/foreign-key.test.ts` — 12
- `packages/activerecord/src/type/unsigned-integer.test.ts` — 5
- `packages/activerecord/src/type/time.test.ts` — 2
- `packages/activerecord/src/type/type-map.test.ts` — 1
- `packages/activerecord/src/scoping/default-scoping.test.ts` — 5
- `packages/activerecord/src/scoping/named-scoping.test.ts` — 1
- `packages/activerecord/src/adapters/sqlite3/sqlite3-adapter.test.ts` — 4
- `packages/activerecord/src/adapters/sqlite3/json.test.ts` — 1
- `packages/activerecord/src/adapters/sqlite3/statement-pool.test.ts` — 1
- `packages/activerecord/src/database-configurations/url-config.test.ts` — 3
- `packages/activerecord/src/database-configurations/hash-config.test.ts` — 2
- `packages/activerecord/src/database-configurations/resolver.test.ts` — 1
- `packages/activerecord/src/tasks/database-tasks.test.ts` — 4
- `packages/activerecord/src/validations/i18n-validation.test.ts` — 2
- `packages/activerecord/src/validations/uniqueness-validation.test.ts` — 1
- `packages/activerecord/src/validations/association-validation.test.ts` — 1
- `packages/activerecord/src/assertions/query-assertions.test.ts` — 3
- `packages/activerecord/src/attribute-methods/read.test.ts` — 3

## Acceptance criteria

- [ ] Each extra is (a) a Rails test under a drifted name or describe path → matched to Rails' name/path (never renaming a Rails-named test); (b) a duplicate of a ported Rails test → deleted; or (c) genuinely TS-only → moved to the `.trails.test.ts` sibling unchanged.
- [ ] The files above report 0 extra in `pnpm parity:test`.

## Verification

```bash
pnpm parity:test --package activerecord --sort-extra --min-extra=1
```
