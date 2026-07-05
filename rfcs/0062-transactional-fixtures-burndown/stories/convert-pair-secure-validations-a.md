---
title: "Convert Bucket A pair→fixtures([]): secure + type + validations (4/4)"
status: ready
updated: 2026-07-05
rfc: "0062-transactional-fixtures-burndown"
cluster: fixtures-burndown-a
deps: []
deps-rfc: []
est-loc: 80
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
