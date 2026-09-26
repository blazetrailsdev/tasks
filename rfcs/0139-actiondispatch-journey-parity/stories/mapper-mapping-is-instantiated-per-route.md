---
title: "Mapper::Mapping is static-only; Rails instantiates one per route"
status: in-progress
updated: 2026-09-26
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8134
claim: "2026-09-26T03:32:04Z"
assignee: "mapper-mapping-is-instantiated-per-route"
blocked-by: null
closed-reason: null
---

## Context

Rails builds one `Mapper::Mapping` per route: `Mapping.build`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:90-102`)
calls `new`, whose `initialize` (`mapper.rb:132-189`) computes `@blocks`,
`@defaults` and the split constraints. `make_route` then builds the
`Journey::Route` with `app(@blocks)` (`mapper.rb:294-303`). `blocks`, `app`,
`constraints` and `normalize_options!` are all private instance methods.

trails' `Mapping` (`packages/actionpack/src/action-dispatch/routing/mapper.ts`)
is never instantiated. It carries only statics (`normalizePath`,
`optionalFormat`, and `blocks`, which trails#8126 added as a static because
there is no instance to hang it on). `Mapping#initialize`'s body is spread
across `Mapper#addRoute`, and `Mapping#app` lives in `RouteSet#_app`
(`routing/route-set.ts`), which reads the `blocks` that `addRoute` stored on
`Route`.

## Acceptance criteria

- `Mapper#addRoute` / `decomposedMatch` build a `Mapping` through
  `Mapping.build` and `new Mapping(...)`, and `blocks` / `app` are instance
  methods at their Rails names.
- `RouteSet#_app` is retired onto `Mapping#app`, and `Route` no longer carries
  `blocks` just to hand them to `_app`.
