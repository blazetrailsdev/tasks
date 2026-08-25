---
title: "converge-nullpool-protocol-retire-poolabsent-realpool"
status: done
updated: 2026-08-02
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 5885
claim: "2026-08-02T13:15:09Z"
assignee: "converge-nullpool-protocol-retire-poolabsent-realpool"
blocked-by: null
closed-reason: null
---

## Context

Found while classifying extra surface in #5343
(`extra-surface-schema-cache-and-pool-sync-api`). Two exported helpers in
`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts`
were allowlisted as justified deviations, but the underlying deviation is
convergeable and worth retiring:

- `poolAbsent(pool)` (`connection-pool.ts:173`) — `pool == null || pool
instanceof NullPool`
- `realPool(pool)` (`:184`) — `poolAbsent(pool) ? null : pool`

Rails needs neither. A standalone adapter carries `@pool = NullPool.new`
(`connection_pool.rb:14`), and Rails' `NullPool` answers the whole pool
protocol with nils/no-ops, so Ruby callers never have to ask "is this a
real pool?" — they just call through it.

Trails' `NullPool` (`connection-pool.ts:112-164`) implements only part of
that protocol: `schemaCache` returns `null`, `checkout()` **throws**
`ConnectionNotEstablished`, and `dbConfig` returns `NULL_CONFIG`. Because
`checkout()` throws rather than degrading, every caller that might hold a
bare adapter has to special-case it up front — which is what `poolAbsent`
/ `realPool` exist to centralize. Call sites today:
`abstract-adapter.ts` (the `columnForAttribute` bare-adapter branch,
`:2452`) and `schema-cache.ts` (`columns`, the null-pool guard at `:251`),
plus `realPool` at `insert-all.ts`, `model-schema.ts`,
`validations/uniqueness.ts`, `test-helpers/with-transactional-fixtures.ts`.

Note `realPool` is load-bearing for the schema-cache-pool-target finding
(the cache must target `realPool(adapter.pool) ?? adapter`, never the bare
pool), so this is a behavior-preserving refactor, not a deletion.

## Acceptance criteria

- Decide, against `connection_pool.rb`, whether trails' `NullPool` can
  answer the protocol faithfully enough that callers stop asking
  `poolAbsent` — in particular whether `checkout()` should keep throwing
  (Rails' raises `ConnectionNotEstablished` too, so the divergence may be
  in _when_ trails calls it, not in NullPool itself).
- If convergeable: retire `poolAbsent` / `realPool`, move the
  null-pool handling behind the pool protocol, leaving no
  `@noRailsEquivalent` tag on either name (`scripts/api-compare/extra-surface.ts:44-47`).
- If not convergeable, record why at the declarations as a
  `@noRailsEquivalent PERMANENT <reason>` tag (`scripts/api-compare/extra-surface.ts:44-47`) — a negative result is
  a valid outcome here, as long as the reason is the real one and the
  surface really is irreducible (#5342).
- `pnpm parity:api:extra --package activerecord` must not regress
  `connection-adapters/abstract/connection-pool.ts` above 0 novel.
- Existing tests pass; no test renames.
