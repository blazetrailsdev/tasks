---
title: "flip-permanent-connection-checkout-disallowed"
status: closed
updated: 2026-07-25
rfc: "0071-ar-test-helper-suite-wide-config-fidelity"
cluster: null
deps: ["route-fixture-machinery-off-base-connection", "fix-with-connection-production-violations"]
deps-rfc: []
est-loc: 60
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

`vendor/rails/activerecord/test/cases/helper.rb:27` sets
`ActiveRecord.permanent_connection_checkout = :disallowed` suite-wide. trails
has the flag (`ar-config.ts:126`) and a faithful, test-pinned enforcement branch
(`connection-handling.ts:453-476` mirroring `connection_handling.rb:274-295`,
pinned by `connection-handling.test.ts:145`) but no setup file sets it.

**Do not start this until the two infrastructure stories are merged**:
`route-fixture-machinery-off-base-connection` (86% of all hits) and
`fix-with-connection-production-violations` (boot-time + production sites).

After those land, the audit measured the residue at **33 test-file call sites
across 23 files**. Full line-level list is in the audit report's "The 33
test-file sites to convert" section. Notes:

- `connection-handling.test.ts:145` must stay as-is — it is the Rails-named test
  asserting the raise.
- `establish-connection.test.ts` (6 sites) is the largest cluster and is about
  connection wiring; several of its sites may also be intentional.

## Acceptance criteria

- `test-setup-ar.ts` sets `permanentConnectionCheckout = "disallowed"` beside
  the other suite-wide config, mirroring `helper.rb:27`.
- The residual test-file sites are converted to `withConnection` /
  `leaseConnection`, less the intentional ones noted above.
- **Run PG and MySQL lanes in CI before merging.** 29 of the 114 audited files
  are adapter-lane and did not execute on the sqlite lane, so their sites are
  unmeasured — this is the one place the 33-site figure could grow.
- PR body notes that `connection-handling.ts:455`'s `_adapter` fast path
  short-circuits _above_ the flag check, so the ban is narrower than Rails'
  (116 `.adapter =` assignments across 32 test files never reach the gate).

Est. ~60 LOC, but the adapter-lane residue could push it over; split if so.
