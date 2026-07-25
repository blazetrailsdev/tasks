---
title: "route-fixture-machinery-off-base-connection"
status: closed
updated: 2026-07-25
rfc: "0071-ar-test-helper-suite-wide-config-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by RFC 0073 (permanent-connection-checkout-disallowed), which re-measured against current main: #5323 already fixed core.ts/insert-all.ts and the test-setup-dy boot blocker, so the original slot B is largely obsolete."
---

## Context

Found by `audit-permanent-connection-checkout-disallowed` (PR #5318,
`docs/infrastructure/permanent-connection-checkout-disallowed-audit.md`).

`packages/activerecord/src/test-helpers/use-fixtures.ts:610`:

```ts
const getConnection = connection ?? (() => Base.connection);
```

Every `fixtures({...})` call without an explicit `connection` option resolves
its adapter through the deprecated `Base.connection` getter, and does so before
the fixture pin makes the lease sticky. Instrumenting the
`permanentConnectionCheckout = "disallowed"` gate over all 114 files carrying a
textual `Base.connection` recorded 1951 hits; **1685 of them (86%) come from
this single line**.

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
- No behavior change to fixture setup; the existing fixture suites stay green.
- Verify by re-running the audit's instrumentation: hits from these two sites
  drop to 0.

Blocks `flip-permanent-connection-checkout-disallowed`. Worth doing on its own
merits regardless of whether the flag flip ever lands.
