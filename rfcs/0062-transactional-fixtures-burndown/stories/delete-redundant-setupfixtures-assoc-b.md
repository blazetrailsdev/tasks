---
title: "Delete redundant setupFixtures beside fixtures(): associations half (1/2)"
status: ready
updated: 2026-07-05
rfc: "0062-transactional-fixtures-burndown"
cluster: fixtures-burndown-b
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

RFC 0062 (transactional-fixtures burndown). Conversion cluster from the
caller audit (`docs/infrastructure/setupfixtures-caller-buckets-audit.md`, story `audit-setupfixtures-caller-buckets`).

**Bucket B.** Redundant `setupFixtures()` beside a `fixtures(...)` call (which re-wires the suite internally, use-fixtures.ts:664). Delete the dead `setupFixtures()` line and its import if now unused. Zero behavior change.

See the audit doc for the wiring identity and the no-fixture-data surface
decision (`fixtures([], { … })` — `use-fixtures.ts:439-443` treats an empty
array as a vacuous zero-fixture case that still wires suite + per-test txn).

## Files (14)

```text
packages/activerecord/src/adapters/abstract-mysql-adapter/mysql-explain.test.ts
packages/activerecord/src/adapter.test.ts
packages/activerecord/src/annotate.test.ts
packages/activerecord/src/associations/association-scope-cache.test.ts
packages/activerecord/src/associations/callbacks.test.ts
packages/activerecord/src/associations/eager.test.ts
packages/activerecord/src/associations/getmodelcolumns-virtual-projection.test.ts
packages/activerecord/src/associations/has-many-through-associations.test.ts
packages/activerecord/src/associations/has-many-through-disable-joins-associations.test.ts
packages/activerecord/src/associations/inverse-associations.test.ts
packages/activerecord/src/associations/preloader-bigint-number-key-match.test.ts
packages/activerecord/src/callbacks.test.ts
packages/activerecord/src/clone.test.ts
packages/activerecord/src/connection-handling.test.ts
```

## Acceptance criteria

- Convert each listed file per the Bucket B target above.
- No test renames; test names match Rails verbatim.
- Run only the touched files locally (`pnpm vitest run <file>`); do not run the full suite.
- <500 LOC; single PR from main; no stacked PRs.
