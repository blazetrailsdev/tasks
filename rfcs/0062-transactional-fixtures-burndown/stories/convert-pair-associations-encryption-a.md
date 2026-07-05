---
title: "Convert Bucket A pair→fixtures([]): associations + encryption (2/4)"
status: ready
updated: 2026-07-05
rfc: "0062-transactional-fixtures-burndown"
cluster: fixtures-burndown-a
deps: []
deps-rfc: []
est-loc: 110
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

## Files (14)

```text
packages/activerecord/src/attribute-methods.test.ts
packages/activerecord/src/attribute-methods.trails.test.ts
packages/activerecord/src/attributes.test.ts
packages/activerecord/src/autosave-association.test.ts
packages/activerecord/src/base-prevent-writes.test.ts
packages/activerecord/src/base.test.ts
packages/activerecord/src/bigint-roundtrip.test.ts
packages/activerecord/src/column-names-sync-virtual-exclusion.test.ts
packages/activerecord/src/dirty.test.ts
packages/activerecord/src/encryption/contexts.test.ts
packages/activerecord/src/encryption/extended-deterministic-queries.test.ts
packages/activerecord/src/encryption/unencrypted-attributes.test.ts
packages/activerecord/src/encryption/uniqueness-validations.test.ts
packages/activerecord/src/finder-respond-to.test.ts
```

## Acceptance criteria

- Convert each listed file per the Bucket A target above.
- No test renames; test names match Rails verbatim.
- Run only the touched files locally (`pnpm vitest run <file>`); do not run the full suite.
- <500 LOC; single PR from main; no stacked PRs.
