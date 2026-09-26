---
title: "resources/resource routes drop the scope's constraints blocks"
status: ready
updated: 2026-09-26
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 50
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails threads the scope's `constraints do ... end` block list into every route
the mapper builds: `Mapping.build` reads `scope[:blocks]`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:90-96`)
and `Mapping#initialize` keeps it as `@blocks` when the route's own
`constraints:` is a Hash (`mapper.rb:152-160`), so `Mapping#app(blocks)`
(`mapper.rb:294-303`) wraps the dispatcher in `Constraints(..., SERVE)`.
`resources` / `resource` reach that through `match` like every other route.

trails' `Mapper#addRoute` now carries `scope.blocks` onto `Route#blocks`
(port-mapping-app-static-dispatcher-and-serve-constraints-arms), but the
`resources` / `resource` / member builders in
`packages/actionpack/src/action-dispatch/routing/mapper.ts` construct
`new Route(...)` directly (21 sites) and never pass `blocks`. So
`constraints(lambda) { resources :posts }` builds routes that skip the lambda.

## Acceptance criteria

- A route built by `resources` / `resource` inside a callable `constraints`
  scope carries the scope's blocks and dispatches through
  `Constraints(..., SERVE)`, cascading when the constraint rejects.
- Converge onto Rails' shape (the resource builders going through `match`)
  rather than threading `blocks` into each direct `new Route` call, where the
  diff allows.
