---
title: "url-for-options-symbol-keyed"
status: draft
updated: 2026-09-15
rfc: "0130-activerecord-extra-surface-receipt-burndown"
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

Rails' url_for options are Symbol-keyed end to end: `ActionView::RoutingUrlFor#url_for`
does `options = options.symbolize_keys` (`actionview/lib/action_view/routing_url_for.rb:89`)
and `ActionDispatch::Routing::UrlFor#full_url_for` does
`options.to_h.symbolize_keys.reverse_merge!(url_options)` (`action_dispatch/routing/url_for.rb:188`)
before `_routes.url_for`, which reads `:only_path`, `:host`, `:controller`, `:action`.

trails' `fullUrlFor` (`packages/actionpack/src/action-dispatch/routing/url-for.ts:69-81`) shallow-copies
and reads bare `use_route`; `RouteSet#urlFor` reads `options.onlyPath` / `options.host` (~10 reads in
`action-dispatch/routing`); `ensureOnlyPathOption` (`packages/actionview/src/routing-url-for.ts:81`) reads
bare `only_path`/`host`. Until those read `":only_path"` etc., `RoutingUrlFor#urlFor` cannot call `symbolizeKeys`.

## Acceptance criteria

- `fullUrlFor` calls `symbolizeKeys` as `url_for.rb:188` does; `RouteSet#urlFor` and the route formatter read Symbol-spelled option keys.
- `ensureOnlyPathOption` reads/writes `":only_path"` / `":host"`.
- Unblocks `symbolize-keys-bare-key-callers-converge`'s routing-url-for half.
