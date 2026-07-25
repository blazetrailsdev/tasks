---
title: "arm-permanent-connection-checkout-disallowed"
status: draft
updated: 2026-07-25
rfc: "0073-permanent-connection-checkout-disallowed"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: 45
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The terminal story: set `permanentConnectionCheckout = "disallowed"` in the AR
suite setup, mirroring `vendor/rails/activerecord/test/cases/helper.rb:27`.

**Do not start until stories A, B and C are merged.** With the raise armed and
any of them outstanding, files fail at _collection_, not with a useful
per-test error.

trails already has the flag (`ar-config.ts:126`) and a faithful enforcement
branch (`connection-handling.ts:485-500` mirroring `connection_handling.rb:274-295`),
pinned by `connection-handling.test.ts:145`. This story only arms it.

## Acceptance criteria

- `test-setup-ar.ts` sets `permanentConnectionCheckout = "disallowed"` beside the
  other suite-wide config, mirroring `helper.rb:27`.
- Full AR suite green on **sqlite, PG and MySQL** lanes.
- Any site kept as a deliberate exception is listed in the PR body with its
  reason.
- PR body notes the two standing caveats from the RFC:
  1. `connection-handling.ts:487`'s `_adapter` fast path short-circuits _above_
     the flag check, so 116 `.adapter =` assignments across 32 test files never
     reach the gate — trails' ban is narrower than Rails'.
  2. Internal query paths are wrapped in `withQueryConnection` (17 call sites),
     which makes `isPermanentLease()` false, so inner `.connection` reads never
     reach the gate. The flip prevents regression; it does not prove internal
     fidelity. That convergence is RFC 0030
     `thread-yielded-connection-internal-query-path`.

## Verification

Re-run the audit instrumentation one final time and confirm the hit count is
zero (or exactly the documented exceptions). The method is in
`docs/infrastructure/permanent-connection-checkout-disallowed-audit.md`.
