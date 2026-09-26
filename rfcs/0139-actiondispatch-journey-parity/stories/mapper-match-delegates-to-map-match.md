---
title: "Mapper#match computes via and adds routes itself where Rails delegates to map_match"
status: done
updated: 2026-09-26
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: trails#8154
claim: "2026-09-26T17:42:02Z"
assignee: "journey-route-matches-else-arm-is-case-equality"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Mapper::Base#match(path, *rest, &block)`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:1689-1720`)
does no routing work of its own. It normalizes its arguments into
`paths` / `options`, handling the `match "path" => "c#a"` hash form, the Symbol
`to:` → `:action` arm and the String `to:` → `:controller` arm. It then calls
`map_match(paths, options)`, wrapped in `defaults(...)` when a `:defaults` key
is present. `map_match` (`mapper.rb:1962-2000`) is the single place that computes
`via = Mapping.check_via Array(options.delete(:via) { @scope[:via] })`, and it
continues into `decomposed_match` → `add_route`.

trails inverts this. `Mapper#match`
(`packages/actionpack/src/action-dispatch/routing/mapper.ts`, `match(path, options)`)
computes `via` itself and calls the private `addRoute` directly. `mapMatch` is a
separate entry point that `decomposedMatch` re-enters through `this.match(...)`.
So:

- `via` is computed and `check_via`'d twice on the `mapMatch → decomposedMatch → match`
  path (trails#8132 ported `check_via` into both bodies).
- `match` has none of Rails' hash-form / `to:`-Symbol / `:defaults` arms.
- `decomposedMatch` re-enters the public `match` instead of `add_route`
  (`mapper.rb:2002-2020` calls `add_route(path, controller, options, _path, to, via, formatted, anchor, options_constraints)`).

## Converged shape

- `match` mirrors `mapper.rb:1689-1720` line for line and ends in `mapMatch(paths, options)`.
- `mapMatch` is the only site computing `via` through `Mapping.checkVia`.
- `decomposedMatch` calls `addRoute` with Rails' argument list, not `match`.

## Acceptance criteria

- `Mapper#match` has no `via` computation and no `addRoute` call.
- `decomposedMatch` does not call `match`.
- `pnpm parity:api:calls` credits `match`'s `map_match` / `defaults` calls, and the routing test files stay green.
