---
title: "Trim trailing parts that restate route defaults in RouteSet#generate"
status: in-progress
updated: 2026-09-08
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: 50
pr: 7632
claim: "2026-09-08T21:17:42Z"
assignee: "mapper-match-fans-out-one-route-per-verb"
blocked-by: null
closed-reason: null
---

## Context

`Journey::Formatter#generate` trims trailing parts that merely restate the
route's defaults before handing the hash to `route.format`
(`vendor/rails/actionpack/lib/action_dispatch/journey/formatter.rb:88-98`):

    defaults       = route.defaults
    required_parts = route.required_parts

    route.parts.reverse_each do |key|
      break if defaults[key].nil? && parameterized_parts[key].present?
      next if parameterized_parts[key].to_s != defaults[key].to_s
      break if required_parts.include?(key)

      parameterized_parts.delete(key)
    end

trails' `RouteSet#generate`
(`packages/actionpack/src/action-dispatch/routing/route-set.ts`) has no
counterpart: after `extractParameterizedParts` it calls `route.pathFor`
directly. So a generated path keeps an optional trailing segment whose value
equals the route's default, where Rails would omit it — e.g. a route with
`defaults: { action: "index" }` and an optional `(/:action)` generates
`/posts/index` where Rails generates `/posts`.

Surfaced while porting `journey/router_test.rb` in PR 7610, whose 35 tests do
not distinguish the two (none pairs an optional part with a matching default),
so nothing regressed — but the loop is absent from a method that PR rewrote.

## Acceptance criteria

- `RouteSet#generate` gains the trimming loop, mirroring `formatter.rb:88-98`
  arm for arm: the `defaults[key].nil? && parameterized_parts[key].present?`
  break, the `to_s` inequality `next`, and the `required_parts.include?(key)`
  break — in that order, iterating `route.parts` in reverse.
- Ruby's `present?` and `to_s` semantics are honoured rather than approximated
  by JS truthiness (`""` is blank in Ruby, truthy in JS).
- A test pins that an optional trailing part equal to the route's default is
  omitted from the generated path, and that a required part is never trimmed.
- `pnpm parity:test --package actiondispatch` and the assertion ratchet do not
  regress.
