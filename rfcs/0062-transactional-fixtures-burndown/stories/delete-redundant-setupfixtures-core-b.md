---
title: "Delete redundant setupFixtures beside fixtures(): core half (2/2)"
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
packages/activerecord/src/date.test.ts
packages/activerecord/src/insert-all.test.ts
packages/activerecord/src/json-serialization.test.ts
packages/activerecord/src/multiparameter-attributes.test.ts
packages/activerecord/src/multiple-db.test.ts
packages/activerecord/src/primary-keys.test.ts
packages/activerecord/src/query-cache.test.ts
packages/activerecord/src/relation/select-star-join-collision.test.ts
packages/activerecord/src/relation/select.test.ts
packages/activerecord/src/strict-loading.trails.test.ts
packages/activerecord/src/timestamp.test.ts
packages/activerecord/src/transactions.trails.test.ts
packages/activerecord/src/validations/uniqueness-validation.test.ts
packages/activerecord/src/validations/validations.test.ts
```

## Acceptance criteria

- Convert each listed file per the Bucket B target above.
- No test renames; test names match Rails verbatim.
- Run only the touched files locally (`pnpm vitest run <file>`); do not run the full suite.
- <500 LOC; single PR from main; no stacked PRs.
