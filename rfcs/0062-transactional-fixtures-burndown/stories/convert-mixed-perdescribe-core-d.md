---
title: "Convert Bucket D mixed per-describe: core (2/2)"
status: ready
updated: 2026-07-05
rfc: "0062-transactional-fixtures-burndown"
cluster: fixtures-burndown-d
deps: []
deps-rfc: []
est-loc: 120
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

**Bucket D.** Mixed per-describe: file has the top-level pair AND a `fixtures(...)` call. Hand-convert per describe block — data blocks to `fixtures([...])`, no-data blocks to `fixtures([], …)`, drop the redundant top-level pair. Read each block before converting.

See the audit doc for the wiring identity and the no-fixture-data surface
decision (`fixtures([], { … })` — `use-fixtures.ts:439-443` treats an empty
array as a vacuous zero-fixture case that still wires suite + per-test txn).

## Files (5)

```text
packages/activerecord/src/delegate.test.ts
packages/activerecord/src/finder.test.ts
packages/activerecord/src/persistence.test.ts
packages/activerecord/src/persistence.trails.test.ts
packages/activerecord/src/relation.trails.test.ts
```

## Acceptance criteria

- Convert each listed file per the Bucket D target above.
- No test renames; test names match Rails verbatim.
- Run only the touched files locally (`pnpm vitest run <file>`); do not run the full suite.
- <500 LOC; single PR from main; no stacked PRs.
