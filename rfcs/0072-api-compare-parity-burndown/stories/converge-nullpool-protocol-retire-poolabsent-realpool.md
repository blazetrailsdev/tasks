---
title: "converge-nullpool-protocol-retire-poolabsent-realpool"
status: ready
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
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
  null-pool handling behind the pool protocol, and drop both
  `extra-surface-allow.json` entries.
- If not convergeable, record why at the declarations (replacing the
  current reasons) and leave the allowlist entries — a negative result is
  a valid outcome here, as long as the reason is the real one.
- `pnpm api:extra --package activerecord` must not regress
  `connection-adapters/abstract/connection-pool.ts` above 0 novel.
- Existing tests pass; no test renames.
