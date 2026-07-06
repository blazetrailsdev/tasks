---
title: "Terminal: delete setupFixtures + useHandlerTransactionalFixtures surface"
status: claimed
updated: 2026-07-06
rfc: "0062-transactional-fixtures-burndown"
cluster: null
deps:
  - audit-setupfixtures-caller-buckets
  - convert-remaining-setupfixtures-callers-to-fixtures
deps-rfc: []
est-loc: 120
priority: 0
pr: null
claim: "2026-07-06T00:11:19Z"
assignee: "delete-setupfixtures-surface"
blocked-by: null
closed-reason: null
---

## Context

RFC 0062 (transactional-fixtures burndown). Terminal removal. Runnable only once
the conversion stories have driven callers to zero:
`git grep -l "setupFixtures\|useHandlerTransactionalFixtures" packages/activerecord/src/**/*.test.ts`
-> only `test-helpers/` (if any).

Delete the deprecated decomposed surface once `fixtures({...})` is the sole
entry point:

- `setupFixtures` (`test-helpers/fixtures.ts:91`) and, if it has no remaining
  standalone users, `setupHandlerSuite` (`test-helpers/setup-handler-suite.ts`).
- `useHandlerTransactionalFixtures` (`test-helpers/use-handler-transactional-fixtures.ts`).
- The RFC 0062 exclude JSON + lint ratchet (its job is done at zero).

Keep `withTransactionalFixtures` / `setupHandlerSuite` internals if
`fixtures({})` still composes them.

## Acceptance criteria

- No `setupFixtures` / `useHandlerTransactionalFixtures` symbol outside
  `test-helpers/` internals; grep gate at zero.
- RFC 0062 exclude + ratchet removed.
- `test:compare` delta >= 0; no test renames.
