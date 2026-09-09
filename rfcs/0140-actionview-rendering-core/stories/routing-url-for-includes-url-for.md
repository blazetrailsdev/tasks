---
title: "Port RoutingUrlFor and the ActionDispatch::Routing::UrlFor include"
status: done
updated: 2026-09-09
rfc: "0140-actionview-rendering-core"
cluster: null
packages:
  - "actionview"
deps: []
deps-rfc: []
est-loc: 150
priority: 31
pr: 7649
claim: "2026-09-09T17:31:10Z"
assignee: "routing-url-for-includes-url-for"
blocked-by: null
closed-reason: null
---

## Context

`routing_url_for.rb` (6 methods) is absent. It is ActionView's `url_for`
override — the one that handles a String, a Hash with `:only_path`, an array of
records, and `nil` meaning "the current page" — layered over
`ActionDispatch::Routing::UrlFor`.

The include is not done in actionview: `railtie.rb:97-101` does it from the
actionpack side, inside an `on_load(:action_controller)` hook:

```ruby
ActionView::RoutingUrlFor.include(ActionDispatch::Routing::UrlFor)
```

So the module must exist here before that initializer can be ported, and this
story lands the module plus the load hook, in that order.

## Converged shape

`packages/actionview/src/routing-url-for.ts` with the six methods, and the
`on_load(:action_controller)` hook at the site `railtie.rb` puts it. The mixin
uses the repo's `include()` idiom rather than a hand-assigned static.

## Acceptance criteria

- `routing_url_for.rb` reports 0 missing in
  `pnpm parity:api --package actionview`.
- `urlFor(nil)` returns the current page's path; a String passes through; a Hash
  routes through the route set; an array of records goes to polymorphic routing.
- The include happens through the load hook, so importing actionview alone does
  not pull actionpack — verified by a plain-node import of the built
  `dist/routing-url-for.js`.
