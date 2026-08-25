---
title: "Port query-cache multi-role connected_to tests once roles land"
status: done
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 4850
claim: "2026-07-13T20:42:33Z"
assignee: "query-cache-multi-role-connected-to-tests"
blocked-by: null
---

## Context

Surfaced by the faithful port of `query_cache_test.rb`
(`converge-query-cache-one-schema`, PR #4340). Several Rails query-cache tests
exercise the multi-role connection handler (`connected_to(role: :reading)` /
`:writing`, `establish_connection` per role, `connection_pool_list(:all)`),
which trails' single-pool handler does not support. They are left `it.skip`
("BLOCKED: multi-role connection handler") in
`packages/activerecord/src/query-cache.test.ts`:

- `query cache is applied to all connections` (`query_cache_test.rb:127`)
- `cache is not applied when config is false` (`:144`)
- `cache is applied when config is string` (`:162`)
- `cache is applied when config is integer` (`:180`)
- `cache is applied when config is nil` (`:198`)
- `clear query cache is called on all connections` (`:695`)

## Acceptance criteria

- [ ] Gated on trails gaining multi-role connection-handler support
      (`connected_to`/role-scoped `establish_connection`); this story may be a
      tracking placeholder until that lands.
- [ ] Once roles are available, port the six tests faithfully and un-skip them
      in `query-cache.test.ts`.
