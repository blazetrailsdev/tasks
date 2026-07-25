---
title: "route-fixture-machinery-off-deprecated-getter"
status: draft
updated: 2026-07-25
rfc: "0073-permanent-connection-checkout-disallowed"
cluster: null
deps: []
deps-rfc: []
est-loc: 25
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

95.5% of all `permanentConnectionCheckout = "disallowed"` enforcement hits come
from one line. Measured against `main` 2026-07-25 by instrumenting the gate and
running all 129 AR test files carrying a textual `.connection`: 2077 hits total,
**1983 of them from `use-fixtures.ts:610`**.

`packages/activerecord/src/test-helpers/use-fixtures.ts:610`:

```ts
const getConnection = connection ?? (() => Base.connection);
```

Every `fixtures({...})` call without an explicit `connection` option resolves its
adapter through the deprecated getter, and does so _before_ the fixture pin makes
the lease sticky — so it reaches the gate.

`use-transactional-tests.ts:67` (`withTransactionalFixtures(() => Base.connection, {...})`)
is the same defect in the smaller opt-in helper (2 hits).

Rails' equivalent machinery never touches the deprecated getter:
`vendor/rails/activerecord/lib/active_record/test_fixtures.rb:179` and `:194`
both call `pool.lease_connection` on the pool retrieved from the connection
handler.

## Acceptance criteria

- `use-fixtures.ts:610` resolves its connection from the pool (per
  `test_fixtures.rb:179/194`) rather than reading `Base.connection`.
- `use-transactional-tests.ts:67` likewise.
- No behavior change to fixture setup; existing fixture suites stay green.
- Verify by re-running the gate instrumentation: hits from these two sites drop
  to 0.
- **Run PG and MySQL lanes in CI**, not just sqlite — see the RFC's constraint 1.

## Caution

Do NOT reach for `withConnection` here if the resolution touches a model-facing
path: it raises `ConnectionNotDefined` for `Model.adapter = x` models and HABTM
join models. `withPooledOrDirectConnection(modelClass, fn)` from
`connection-handling.ts` is the correct helper. This failure mode does not
reproduce on SQLite.

Worth shipping on its own merits regardless of whether the flag flip lands.
