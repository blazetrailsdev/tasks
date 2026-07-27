---
title: "retire-connection-pool-async-resolution-shims"
status: ready
updated: 2026-07-27
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

Found by the `@noRailsEquivalent` tag audit (RFC 0080).
`connection-adapters/abstract/connection-pool.ts` carries six tagged members
beyond the `poolAbsent` / `realPool` pair already owned by
`converge-nullpool-protocol-retire-poolabsent-realpool`:

- `setConnectionHandlerResolver` (:290) — module-cycle wiring hook; Ruby
  resolves the `ActiveRecord::Base` constant at call time
- `adapterReady` (:346) — trails resolves adapters via dynamic `import()`,
  Rails' `require` is synchronous
- `queryCacheDisabled` (:586) — Rails asks
  `pool.db_config&.query_cache == false` inline; trails' config also accepts a
  "disabled" alias
- `leaseConnectionSync` (:673) — sync twin of Rails' synchronous
  `lease_connection`, needed because trails' `leaseConnection` became async
- `discardBangDraining` (:1068) and `drainPendingCloses` (:1258) — bookkeeping
  for async `close`, which Ruby's synchronous `driver.close` never needs

All six are consequences of two trails-side choices — async adapter loading and
async lease/close — not of anything JavaScript forbids. They belong to the
pool async/sync surface convergence, not to a permanent-exception tag.

## Acceptance criteria

- Classify each of the six against the outcome of the pool async/sync
  convergence: retired, kept as `@internal`, or genuinely permanent with a
  reason that names the runtime constraint.
- Retire the ones that converge and delete their `@noRailsEquivalent` tags.
- `queryCacheDisabled` in particular: decide whether the "disabled" config
  alias is itself a trails invention that should be normalized at config-read
  time, which would remove the predicate entirely.
- `pnpm api:extra --package activerecord` reports no stale tags.
