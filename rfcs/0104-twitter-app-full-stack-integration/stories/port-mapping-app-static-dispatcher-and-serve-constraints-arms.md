---
title: "Port Mapping#app's StaticDispatcher and blocks.any? arms"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`RouteSet#_app` (`packages/actionpack/src/action-dispatch/routing/route-set.ts`,
landed in #7390) ports two of the four branches of `Mapping#app(blocks)`
(`vendor/rails/actionpack/lib/action_dispatch/routing/mapper.rb:294-303`):

```ruby
def app(blocks)
  if to.respond_to?(:action)
    Routing::RouteSet::StaticDispatcher.new to
  elsif to.respond_to?(:call)
    Constraints.new(to, blocks, Constraints::CALL)
  elsif blocks.any?
    Constraints.new(dispatcher(defaults.key?(:controller)), blocks, Constraints::SERVE)
  else
    dispatcher(defaults.key?(:controller))
  end
end
```

Only `to.respond_to?(:call)` and the bare `dispatcher` arm are reached. The two
missing ones are missing because nothing upstream can produce their input:

- `to.respond_to?(:action)` → `StaticDispatcher` (`mapper.rb:295-296`).
  `StaticDispatcher` IS ported (`route-set.ts`, `route_set.rb:71-83`), but
  `Mapper#mount` never records a mounted app that answers `action`, so no
  `Route` reaches `_app` with one.
- `blocks.any?` → `Constraints.new(dispatcher(...), blocks, SERVE)`
  (`mapper.rb:299-300`). `blocks` is the `constraints do ... end` block list
  (`mapper.rb:148-152`); trails' `Route` carries only the request-attribute
  constraint HASH, evaluated in `Route#matches` against the Journey route's
  `constraints`, and no block list at all. `_app` therefore always passes `[]`.

`Constraints` with `SERVE` is consequently unreachable, and `Constraints`'
`matches?` / `constraint_args` bodies are dead — which is how the defect in
`converge-constraints-callable-resolution-to-proc-call` went unnoticed.

## Converged shape

`Route` carries the `constraints do ... end` block list the mapper collects, so
`_app` can pass it as `blocks` and take the `blocks.any?` arm, and `Mapper#mount`
records a `to` that answers `action` so the `StaticDispatcher` arm is reachable.
`_app` then mirrors `mapper.rb:294-303` branch for branch, and the JSDoc
paragraph on `_app` naming the two skipped arms is deleted.

Note that once blocks reach `Constraints`, request-attribute constraints have
two evaluation sites — `Route#matches` (via the Journey route's `constraints`)
and `Constraints#matches?`. Rails has only the latter for blocks and the
Journey pattern requirements for path captures; the split should converge onto
Rails' rather than double-apply.

## Acceptance criteria

- `_app` reproduces all four branches of `mapper.rb:294-303` in Rails' order.
- A route declared with a `constraints do ... end` block dispatches through
  `Constraints(..., SERVE)` and cascades `[404, X-Cascade: pass, []]` when the
  block rejects the request (`mapper.rb:59-63`).
- A mounted app answering `action` dispatches through `StaticDispatcher`.
- The "other two arms" paragraph in `_app`'s JSDoc is removed.
