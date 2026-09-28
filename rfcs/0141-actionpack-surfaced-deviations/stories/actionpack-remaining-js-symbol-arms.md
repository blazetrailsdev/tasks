---
title: "Remaining actionpack sites model a Ruby Symbol as a JS Symbol (helpers, :all, send_stream type, parameters, formatter)"
status: draft
updated: 2026-09-28
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in trails#8230, which removed the JS-`Symbol` arms from `polymorphic-routes.ts` and
`url-for.ts` (CLAUDE.md § "A Ruby Symbol is a JS string, never a JS Symbol"). Several actionpack
sites still model a Ruby Symbol as a JS `Symbol`:

- `abstract-controller/helpers.ts:~193-194`: `modules_for_helpers`'s `when String, Symbol` arm
  (`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/helpers.rb:38`) tests `typeof arg === "symbol"`
  and reads `.description`.
- `action-controller/metal/helpers.ts:~52`: `args.delete(:all)` (`action_controller/metal/helpers.rb:113`)
  matches `typeof arg === "symbol" && arg.description === "all"` alongside the bare `"all"` string.
  The Symbol should be `":all"`.
- `action-controller/metal/live.ts:~228-235`: `send_stream`'s
  `type.is_a?(Symbol) ? Mime[type].to_s : type` (`action_controller/metal/live.rb:359`) checks
  `typeof type === "string"` first, so a `":json"` Symbol string is returned verbatim instead of
  being resolved through `Mime[...]`.
- `action-dispatch/http/parameters.ts:~71` and `action-dispatch/journey/formatter.ts:~317`
  (`rubyInspect`) also carry `typeof … === "symbol"` arms.
- Tests still pass JS Symbols into those arms: `abstract-controller/helpers-resolution.test.ts:44`
  (`Symbol("foo")`), `action-controller/metal/helpers.test.ts:29` (`Symbol("all")`),
  `action-controller/metal/rendering.test.ts:77-78` (`Symbol.for("mobile")` variant), and
  `action-dispatch/testing/assertions/routing.test.ts:120` (`useRoute: Symbol("items")`).

## Acceptance criteria

- Each arm takes a `":name"` string via `isSymbol` / `symbolToS` from `@blazetrails/ruby-compat`,
  in the Rails branch order (String before Symbol only where Rails orders it that way). No JS
  `Symbol` handling remains in these files.
- `send_stream` resolves `":json"` through `Mime[...]` per `live.rb:359`, with a test.
- The listed tests pass `":name"` strings.
