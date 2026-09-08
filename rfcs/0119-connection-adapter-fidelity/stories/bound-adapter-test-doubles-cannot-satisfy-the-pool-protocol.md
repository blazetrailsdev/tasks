---
title: "bound-adapter-test-doubles-cannot-satisfy-the-pool-protocol"
status: ready
updated: 2026-09-08
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Prerequisite for `retire-adapter-bypass-onto-a-single-connection-pool`
(RFC 0119), alongside
`connection-pool-cannot-seat-an-existing-adapter-instance`.

Once a directly-bound model resolves through a real pool instead of the
`_adapter` reader bypass, every read routes through the pool's checkout path:
`acquireConnectionSync` polls `_available`
(`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:556`),
`ConnectionLeasingQueue#internalPoll` calls `conn.lease()` unconditionally
(`connection-adapters/abstract/connection-pool/queue.ts:246-259`), and
`checkoutAndVerify` (`connection-pool.ts:1191-1212`) drives `cleanBang`,
`_runCheckoutCallbacks` and `remove`/`disconnectBang` on failure.

The activerecord suite binds hand-rolled doubles at 111 `X.adapter = <...>`
sites across 27 test files — `model-schema-load.trails.test.ts`,
`model-schema-reload-recursion.trails.test.ts`,
`model-schema-stale-against-ancestor-recursion.trails.test.ts`,
`model-schema-load-own-table-descendant.trails.test.ts`, `migration.test.ts`,
`hot-compatibility.test.ts`, `core.trails.test.ts`,
`date-time-precision.test.ts`, `encryption/test-helpers.ts` among them. None of
those doubles answer `lease`, `expire`, `steal`, `verifyBang`, `owner` or carry
a `dbConfig`, so each would throw the moment the bypass is removed.

## Converged shape

The doubles stop being ad-hoc object literals and go through one shared
test-helper factory that produces something the pool protocol accepts, in the
spirit of Rails' own test adapters
(`vendor/rails/activerecord/test/support/connection.rb`) — the canonical-helper
rule, applied to adapters rather than schemas. Sites keep their per-test
behaviour by overriding on top of the factory's base rather than re-declaring
the protocol.

Split by file group if it does not fit one PR; it is deliberately sized as a
mechanical sweep so the bypass removal itself stays small.

## Acceptance criteria

- [ ] One shared factory in `test-helpers/` produces a double satisfying the
      pool checkout protocol (`lease`, `expire`, `steal`, `verifyBang`,
      `owner`, `dbConfig`).
- [ ] All 111 `X.adapter = <double>` sites use it; no bespoke adapter literal
      re-declares the protocol.
- [ ] The activerecord suite is green on all five adapter lanes with the
      doubles seated in a real pool.
- [ ] No test name changes (`parity:test` delta non-negative).
