---
title: "Convert Bucket A pair→fixtures([]): secure + type + validations (4/4)"
status: done
updated: 2026-07-05
rfc: "0062-transactional-fixtures-burndown"
cluster: fixtures-burndown-a
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 4600
claim: "2026-07-05T11:07:29Z"
assignee: "convert-pair-secure-validations-a"
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

## Files (10)

```text
packages/activerecord/src/relation/value-accessor-semantics.test.ts
packages/activerecord/src/secure-password.test.ts
packages/activerecord/src/secure-token.test.ts
packages/activerecord/src/statement-cache.test.ts
packages/activerecord/src/suppressor.test.ts
packages/activerecord/src/token-for.test.ts
packages/activerecord/src/type/date-time.test.ts
packages/activerecord/src/validations/i18n-validation.test.ts
packages/activerecord/src/validations/length-validation.test.ts
packages/activerecord/src/validations/presence-validation.test.ts
```

## Acceptance criteria

- Convert each listed file per the Bucket A target above.
- No test renames; test names match Rails verbatim.
- Run only the touched files locally (`pnpm vitest run <file>`); do not run the full suite.
- <500 LOC; single PR from main; no stacked PRs.
