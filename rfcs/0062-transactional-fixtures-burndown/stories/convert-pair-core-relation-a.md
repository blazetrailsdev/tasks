---
title: "Convert Bucket A pair→fixtures([]): core + relation (3/4)"
status: in-progress
updated: 2026-07-05
rfc: "0062-transactional-fixtures-burndown"
cluster: fixtures-burndown-a
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: 4599
claim: "2026-07-05T10:07:26Z"
assignee: "convert-pair-core-relation-a"
blocked-by: null
closed-reason: null
---

## Context

RFC 0062 (transactional-fixtures burndown). Conversion cluster from the
caller audit (`docs/infrastructure/setupfixtures-caller-buckets-audit.md`, story `audit-setupfixtures-caller-buckets`).

**Bucket A.** Pair(s) of setupFixtures + useHandlerTransactionalFixtures, no fixture data. The pair is per-`describe`, so a file may hold several (e.g. attribute-methods/base have 3) — convert EVERY pair to a single `fixtures([], { … })` call. Schema setup is orthogonal: some files createTable/defineSchema, ~30 of 54 ride the canonical schema with no table creation at all — leave whatever schema setup exists untouched (Rails fixture wiring is per-test transactional, independent of table creation: vendor/rails/activerecord/lib/active_record/test_fixtures.rb:108-133).

See the audit doc for the wiring identity and the no-fixture-data surface
decision (`fixtures([], { … })` — `use-fixtures.ts:439-443` treats an empty
array as a vacuous zero-fixture case that still wires suite + per-test txn).

## Files (14)

```text
packages/activerecord/src/habtm-destroy-order.test.ts
packages/activerecord/src/i18n.test.ts
packages/activerecord/src/inheritance-namespaced.test.ts
packages/activerecord/src/lazy-schema-reflection.test.ts
packages/activerecord/src/log-subscriber.test.ts
packages/activerecord/src/mixin.test.ts
packages/activerecord/src/model-schema.test.ts
packages/activerecord/src/nested-attributes-with-callbacks.test.ts
packages/activerecord/src/normalized-attribute.test.ts
packages/activerecord/src/numeric-data.test.ts
packages/activerecord/src/reflection.test.ts
packages/activerecord/src/relation/build-joins-from-subquery-dedup.test.ts
packages/activerecord/src/relation/eager-shared-alias-tracker.test.ts
packages/activerecord/src/relation/mutation.test.ts
```

## Acceptance criteria

- Convert each listed file per the Bucket A target above.
- No test renames; test names match Rails verbatim.
- Run only the touched files locally (`pnpm vitest run <file>`); do not run the full suite.
- <500 LOC; single PR from main; no stacked PRs.
