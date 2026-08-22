---
title: "Port the three remaining Hash.new default-block sites to the settled Proxy idiom"
status: claimed
updated: 2026-08-22
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: "2026-08-22T18:19:59Z"
assignee: "benchmarkable-should-mix-in-logger-reader"
blocked-by: null
closed-reason: null
---

## Context

PR #6866 settled the trails spelling for Ruby's default-block Hash
(`Hash.new { |h, k| h[k] = [] }`): an inline `new Proxy({}, { get })` whose trap
vivifies a missing STRING key (`h[k] ??= []`) and forwards non-string keys to
`Reflect.get`. It is inlined at each site, never hoisted into a helper — Ruby
has no helper either, so a shared `defaultHash` would be surface with no Rails
counterpart (`pnpm parity:api:extra`). See
`packages/activerecord/src/relation/query-methods.ts` `buildJoinBuckets`.

The remaining un-converged sites named by the parent story:

- `activerecord/lib/active_record/associations/join_dependency.rb:108-114`
- `activerecord/lib/active_record/connection_adapters/abstract/connection_pool/pool_manager.rb:7`
- `activerecord/lib/active_record/test_fixtures.rb:123`

Each is currently ported as a pre-seeded object literal / eager map, which
emits no constructor and drops the auto-vivification semantics.

## Acceptance criteria

- [ ] Each of the three sites above uses the settled inline Proxy spelling,
      mirroring its own Ruby `Hash.new` line (cite the .rb:LINE at the site).
- [ ] No shared helper is introduced; no new `parity:api:extra` surface.
- [ ] `pnpm parity:api:calls` / `:args` green; any row or `@missingRailsCall`
      tag the conversion retires is deleted (only-shrink).
