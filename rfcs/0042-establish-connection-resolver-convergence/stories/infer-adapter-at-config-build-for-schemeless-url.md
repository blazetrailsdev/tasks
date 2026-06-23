---
title: "Infer adapter at config-build time for scheme-less URL shorthand"
status: ready
updated: 2026-06-23
rfc: "0042-establish-connection-resolver-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`funnel-autoconnect-through-object-path` (PR #3868) routed `autoConnect`'s
resolved `DatabaseConfig` through the shared `establishWithDbConfig` funnel. A
bare `:memory:` from `DATABASE_URL` has no URL scheme, so `buildUrlHash`
(`database-configurations/url-config.ts:89`) returns `{ url: ":memory:" }` with
no `adapter`. The handler's `resolvePoolConfig`
(`connection-adapters/abstract/connection-handler.ts:339-340`) raises
`AdapterNotSpecified` unless the config hash names an adapter, so
`establishWithDbConfig` (`connection-handling.ts`) now backfills the
adapter inferred via `adapterNameFromUrl` onto the config in place.

Rails never hits this: its URL configs always parse a scheme, so
`configuration_hash` always carries an adapter (and is frozen). The backfill is
a benign, documented workaround for trails' scheme-less `:memory:` shorthand,
but the root deviation is that adapter inference happens at connect time rather
than at config-build time.

## Acceptance criteria

- [ ] The inferred adapter for a scheme-less URL shorthand (e.g. `:memory:`)
      lands on the `DatabaseConfig`'s `configuration` hash at build time
      (`UrlConfig`/`buildUrlHash` or `DatabaseConfigurations.fromEnv`), so the
      resolved object already names its adapter.
- [ ] The connect-time backfill in `establishWithDbConfig` becomes unnecessary
      and is removed (or reduced to a defensive no-op assertion).
- [ ] api:compare + test:compare delta non-negative.
