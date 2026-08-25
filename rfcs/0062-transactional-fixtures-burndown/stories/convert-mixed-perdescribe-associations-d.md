---
title: "Convert Bucket D mixed per-describe: associations (1/2)"
status: done
updated: 2026-07-05
rfc: "0062-transactional-fixtures-burndown"
cluster: fixtures-burndown-d
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 4595
claim: "2026-07-05T04:07:26Z"
assignee: "convert-mixed-perdescribe-associations-d"
blocked-by: null
closed-reason: null
---

## Context

RFC 0062 (transactional-fixtures burndown). Conversion cluster from the
caller audit (`docs/infrastructure/setupfixtures-caller-buckets-audit.md`, story `audit-setupfixtures-caller-buckets`).

**Bucket D.** Mixed per-describe: file has the top-level pair AND a `fixtures(...)` call. Hand-convert per describe block — data blocks to `fixtures([...])`, no-data blocks to `fixtures([], …)`, drop the redundant top-level pair. Read each block before converting.

See the audit doc for the wiring identity and the no-fixture-data surface
decision (`fixtures([], { … })` — `use-fixtures.ts:439-443` treats an empty
array as a vacuous zero-fixture case that still wires suite + per-test txn).

## Files (7)

```text
packages/activerecord/src/associations/belongs-to-associations.test.ts
packages/activerecord/src/associations/eager-load-nested-include.test.ts
packages/activerecord/src/associations/has-many-associations.test.ts
packages/activerecord/src/associations/join-model.test.ts
packages/activerecord/src/associations.test.ts
packages/activerecord/src/counter-cache.trails.test.ts
packages/activerecord/src/custom-locking.test.ts
```

## Acceptance criteria

- Convert each listed file per the Bucket D target above.
- No test renames; test names match Rails verbatim.
- Run only the touched files locally (`pnpm vitest run <file>`); do not run the full suite.
- <500 LOC; single PR from main; no stacked PRs.
