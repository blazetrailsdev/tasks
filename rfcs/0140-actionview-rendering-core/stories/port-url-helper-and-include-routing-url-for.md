---
title: "UrlHelper is unported, so nothing includes RoutingUrlFor or defines _back_url"
status: draft
updated: 2026-09-09
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7649 ported `ActionView::RoutingUrlFor`
(`vendor/rails/actionview/lib/action_view/routing_url_for.rb`) and the
`on_load(:action_controller)` include from `railtie.rb:97-101`, so
`routing_url_for.rb` scores 6/6. But nothing in trails _includes_
`RoutingUrlFor` into a view, so no view actually answers `urlFor`.

Rails includes it from `ActionView::Helpers::UrlHelper`
(`vendor/rails/actionview/lib/action_view/helpers/url_helper.rb:31`):

```ruby
module UrlHelper
  extend ActiveSupport::Concern
  include ActionView::RoutingUrlFor
  ...
```

`url_helper.rb` is unported — there is no
`packages/actionview/src/helpers/url-helper.ts`. Two consequences travel with
it:

- `RoutingUrlFor#url_for`'s `:back` arm calls `_back_url`
  (`routing_url_for.rb:105`), which `UrlHelper` defines
  (`url_helper.rb`, `_back_url` / `_filtered_referrer`). The port declares it on
  the `RoutingUrlForHost` interface
  (`packages/actionview/src/routing-url-for.ts`) and nothing supplies it.
- `link_to`, `button_to`, `url_for`'s view-facing surface, `mail_to`,
  `current_page?` — the whole helper — are absent.

## Converged shape

Port `actionview/lib/action_view/helpers/url_helper.rb` as
`packages/actionview/src/helpers/url-helper.ts`, with
`include ActionView::RoutingUrlFor` spelled through the repo's `include()`
idiom against the `RoutingUrlFor` class module #7649 landed, and register it in
`helpers/index.ts` the way the other helpers are.

Scope may need splitting — `url_helper.rb` is large. `_back_url` /
`_filtered_referrer` plus the `RoutingUrlFor` include is the slice that closes
the gap this story is about; `link_to` / `button_to` / `mail_to` can be their
own stories.

## Acceptance criteria

- A view host reaches `urlFor` through `UrlHelper`, not by hand-assigning
  `RoutingUrlFor`'s methods.
- `_backUrl` is defined at its Rails site rather than declared on the host
  interface, and `urlFor(":back")` is covered by a test.
- `helpers/url_helper.rb` reports a non-negative delta in
  `pnpm parity:api --package actionview`.
