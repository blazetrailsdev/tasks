---
title: "trailties: close the railtie, engine and application API misses"
status: ready
updated: 2026-11-19
rfc: "0248-trailties-parity-100"
cluster: api-residuals
packages: [trailties]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Members missing from `parity:api --missing`:

- `railtie.rb`: `railtie_namespace`, `load_index`, `increment_load_index`
- `railtie/configurable.rb` (0/3): `config`, `instance`, `configure`
- `engine/lazy_route_set.rb`: `route_defined?`
- `application/routes_reloader.rb`: `initialize`
- `application/default_middleware_stack.rb`: `load_rack_cache` (RFC 0142 `default-middleware-stack-omits-rack-cache` owns the behavior; this story seats the member)

## Acceptance criteria

- [ ] Every member listed above is matched in `pnpm parity:api -- --package trailties --missing`.
- [ ] Each new member follows the Rails body; deviations go through the root CLAUDE.md process.
