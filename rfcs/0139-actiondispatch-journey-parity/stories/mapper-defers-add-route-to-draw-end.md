---
title: "Mapper defers add_route to draw-end where Rails registers at the declaring line"
status: done
updated: 2026-09-08
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 220
priority: 40
pr: trails#7630
claim: "2026-09-08T20:18:27Z"
assignee: "mapper-appends-optional-format-segment"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Mapper#match` registers each route with the set **as it is declared**:
`@set.add_route(mapping, as)` is the last line of `match_route`
(`vendor/rails/actionpack/lib/action_dispatch/routing/mapper.rb:2062`). So a
duplicate `:as` raises `ArgumentError` from inside the `draw` block, at the
offending `get`/`match` line — which is what
`vendor/rails/actionpack/test/journey/routes_test.rb:63-68`
(`test_first_name_wins`) asserts:

```ruby
mapper.get "/hello", to: "foo#bar", as: "aaron"
assert_raise(ArgumentError) do
  mapper.get "/aaron", to: "foo#bar", as: "aaron"
end
```

trails' `Mapper` instead buffers into its own `routes` array, and
`RouteSet#evalBlock` (`packages/actionpack/src/action-dispatch/routing/route-set.ts:644-652`)
flushes them after the block returns:

```ts
const mapper = new Mapper(this);
block(mapper);
for (const route of mapper.routes) {
  this.addRoute(route, route.name);
}
```

So every `RouteSet#addRoute` side effect — the duplicate-name `ArgumentError`
(`route_set.rb:648-655`), the invalid-name `ArgumentError` (`:646`), the
`:controller` segment deprecation warning (`:658-664`) — fires at draw-end
rather than at the declaring line. Surfaced in PR #7611: the ported
`first name wins` test had to assert the raise around `routeSet.draw(...)`
instead of around the second `mapper.get`, as Rails does.

This also makes `Mapper#hasNamedRoute` need two sources (its own buffer plus
`@set.named_routes`) where Rails' `has_named_route?` reads only the set
(`mapper.rb:650-652`).

## Converged shape

Have `Mapper`'s route construction call `this._set.addRoute(...)` directly at
the point of declaration, as `match_route` does, and drop `evalBlock`'s
flush loop. `Mapper#hasNamedRoute` then reduces to the single
`@set.named_routes.key?(name)` read Rails has.

## Acceptance criteria

- [ ] A duplicate `:as` raises from the declaring `mapper.get` call, inside the
      `draw` block, matching `mapper.rb:2062` + `route_set.rb:648-655`.
- [ ] `journey/routes_test.rb`'s `first name wins` asserts the raise around the
      second `mapper.get`, as Rails does, not around `draw`.
- [ ] `Mapper#hasNamedRoute` reads only the set, matching `mapper.rb:650-652`.
- [ ] `pnpm parity:test --package actiondispatch` non-regressing.
