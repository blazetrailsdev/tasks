---
title: "url-for-symbol-arms-use-js-symbol-and-route-for-snake-case"
status: draft
updated: 2026-09-28
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `polymorphic-routes.ts` onto `":name"` Symbols and camelCased
helper dispatch (the `polymorphic-routes-call-persisted-not-is-persisted` /
`polymorphic-routes-dispatch-snake-case-helper-names` bundle).

`ActionDispatch::Routing::UrlFor` (`packages/actionpack/src/action-dispatch/routing/url-for.ts`)
still models a Ruby Symbol as a JS `Symbol`, which CLAUDE.md § "A Ruby Symbol is a JS string"
forbids:

- `fullUrlFor`'s `use_route` arm reads `typeof routeName === "symbol" ? symbolToString(routeName)`
  (`url-for.ts:~78-82`), where Rails passes `options.delete :use_route` straight through
  (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/url_for.rb:187-189`).
- The `when Symbol` arm (`url_for.rb:192-194`) is ported as `typeof options === "symbol"`
  (`url-for.ts:~86-88`) instead of `isSymbol(options)` / `symbolToS`, the shape
  `ActionView::RoutingUrlFor#url_for` (`packages/actionview/src/routing-url-for.ts`) already uses.
- `symbolToString` (`polymorphic-routes.ts`) exists only for those two arms, with an invented
  "description-less Symbol" `ArgumentError`.

And `routeFor` (`url-for.ts`, Rails `route_for`, `url_for.rb:222-224`,
`public_send(:"#{name}_url", *args)`) dispatches to the snake_case `${name}_url`, while
`NamedRouteCollection` defines helpers as `camelize(`${name}\_url`, "lower")`
(`route-set.ts:566-567`), so `routeFor("user")` misses a drawn `userUrl`.

## Acceptance criteria

- `url-for.ts`'s Symbol arms take `":name"` strings via `isSymbol` / `symbolToS`; no JS
  `Symbol` handling remains, and `symbolToString` is deleted.
- `routeFor` dispatches to the camelCased helper name `NamedRouteCollection` defines.
- `url-for.test.ts`'s `Symbol("user")` / `useRoute: Symbol(...)` cases are rewritten to `":user"`,
  and a test calls `routeFor` against a drawn `RouteSet`.
