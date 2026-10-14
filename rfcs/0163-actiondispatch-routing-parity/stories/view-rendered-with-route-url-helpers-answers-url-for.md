---
title: "view-rendered-with-route-url-helpers-answers-url-for"
status: draft
updated: 2026-10-14
rfc: "0163-actiondispatch-routing-parity"
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

`TestPathParameters#test_path_parameters_are_not_mutated`
(`vendor/rails/v8.0.2/actionpack/test/dispatch/routing_test.rb:5169-5208`)
renders `<%= root_path(locale: :ar) %> | <%= url_for(locale: :ar) %>` inline
from a controller that includes `Routes.url_helpers`. In trails the named
helper resolves in the view but `urlFor` does not: the render fails with
`TypeError: (intermediate value).urlFor is not a function`. Rails' view gets
`url_for` from `ActionView::RoutingUrlFor`
(`actionview/lib/action_view/routing_url_for.rb:81`), mixed in through
`UrlFor#_url_for_modules` (`actionpack/lib/action_dispatch/routing/url_for.rb:108-112`,
trails `action-dispatch/routing/url-for.ts:183`).

The port in `packages/actionpack/src/action-dispatch/dispatch/routing.test.ts`
is parked as `it.skip` under `// BLOCKED:` naming this story.

## Acceptance criteria

- [ ] A view rendered by a controller that includes a route set's url helpers
      answers `urlFor` as Rails' `RoutingUrlFor#url_for` does.
- [ ] `path parameters are not mutated` runs with Rails' body.
