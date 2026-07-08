---
title: "Harden ConnectionPool adapter proxy against serialization/matcher probe keys"
status: claimed
updated: 2026-07-08
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-07-08T10:23:23Z"
assignee: "connection-pool-adapter-proxy-serialization-probe-safety"
blocked-by: null
closed-reason: null
---

## Context

PR #4725 made translated adapter errors carry the live `ConnectionPool`
(Rails-faithful `connection_pool: @pool`, `connection-adapters/postgresql-adapter.ts`
`_translateException`). That makes the pool — and its `_getAdapterProxy()` in
`connection-adapters/abstract/connection-pool.ts:386` — reachable from any thrown
error. When such an error becomes an unhandled rejection, vitest serializes it and
walks into the proxy; the `get` trap fabricated a callable for _every_ key, so a
probe of a non-method key ran `pool.withConnection((conn) => conn[prop](...))`
against a raw connection → `TypeError: conn[prop] is not a function`
(3 unhandled errors that failed the PG job on hot-compatibility.test.ts).

PR #4725 patched the specific probes observed: the trap now returns `undefined`
for `typeof prop === "symbol"`, `"then"`, and `"toJSON"`
(`connection-adapters/abstract/connection-pool.ts:396-403`). But the trap still
fabricates a method for any _other_ non-method string key a serializer / test
matcher / framework may probe — e.g. `asymmetricMatch` (vitest asymmetric
matchers), `$$typeof` (React element check), `nodeType`, `constructor` — so the
same crash class can recur.

## Acceptance criteria

- [ ] The adapter proxy `get` trap does not fabricate a callable for
      serialization / matcher / framework probe keys; a probe returns a
      non-callable (undefined) instead of a function that dispatches to the raw
      connection. Prefer a principled rule (e.g. only dispatch known adapter
      method names, or deny a maintained set of probe keys) over ad-hoc additions.
- [ ] A regression test serializes (or asymmetric-matches) an error carrying a
      ConnectionPool and asserts no `conn[prop] is not a function` throw.
- [ ] Real proxy consumers (schemaMigration / internalMetadata dispatch of
      genuine adapter methods) still work.
