---
title: "Convert Bucket A pair→fixtures([]): adapters + associations (1/4)"
status: ready
updated: 2026-07-05
rfc: "0062-transactional-fixtures-burndown"
cluster: fixtures-burndown-a
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

**Bucket A.** Pair (setupFixtures + useHandlerTransactionalFixtures), no fixture data. Replace the two-line pair with a single `fixtures([], { … })` call; keep the bespoke `createTable()` in beforeAll unchanged.

See the audit doc for the wiring identity and the no-fixture-data surface
decision (`fixtures([], { … })` — `use-fixtures.ts:439-443` treats an empty
array as a vacuous zero-fixture case that still wires suite + per-test txn).

## Files (16)

```text
packages/activerecord/src/adapters/abstract-mysql-adapter/adapter-prevent-writes.test.ts
packages/activerecord/src/adapters/postgresql/array.test.ts
packages/activerecord/src/adapters/postgresql/explain.test.ts
packages/activerecord/src/adapters/postgresql/virtual-column.test.ts
packages/activerecord/src/associations/association-scope-alias-tracker.test.ts
packages/activerecord/src/associations/association-scope.test.ts
packages/activerecord/src/associations/cp-count-disable-joins-through.test.ts
packages/activerecord/src/associations/disable-joins-association-scope.test.ts
packages/activerecord/src/associations/disable-joins-composite-key.test.ts
packages/activerecord/src/associations/disable-joins-composite-nested.test.ts
packages/activerecord/src/associations/disable-joins-nested-through.test.ts
packages/activerecord/src/associations/disable-joins-polymorphic-nonid-pk.test.ts
packages/activerecord/src/associations/disable-joins-routing-widening.test.ts
packages/activerecord/src/associations/eager-load-includes-full-sti-class.test.ts
packages/activerecord/src/associations/eager-singularization.test.ts
packages/activerecord/src/associations/required.test.ts
```

## Acceptance criteria

- Convert each listed file per the Bucket A target above.
- No test renames; test names match Rails verbatim.
- Run only the touched files locally (`pnpm vitest run <file>`); do not run the full suite.
- <500 LOC; single PR from main; no stacked PRs.
