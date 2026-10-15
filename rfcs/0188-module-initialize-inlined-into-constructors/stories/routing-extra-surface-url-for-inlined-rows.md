---
title: "Clear parity:api:extra url_for.rb inlined-from rows on routes-proxy.ts and integration.ts"
status: draft
updated: 2026-10-15
rfc: "0188-module-initialize-inlined-into-constructors"
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

RFC 0163's Verification requires `pnpm parity:api:extra --package actiondispatch`
to list no file under `routing/`. On main @ 9dfedbba23 it lists:

- `routing/routes-proxy.ts` `constructor`, `defaultUrlOptions`,
  `isDefaultUrlOptions` inlined-from `routing/url_for.rb`
- `testing/integration.ts` `_urlOptions`, `constructor`, `defaultUrlOptions`
  inlined-from `routing/url_for.rb`

`RoutesProxy` already does `include(RoutesProxy, UrlFor)`
(`packages/actionpack/src/action-dispatch/routing/routes-proxy.ts:170`),
matching `include ActionDispatch::Routing::UrlFor`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/routes_proxy.rb:10`),
but redeclares `defaultUrlOptions` (`routes-proxy.ts:42-44`), which Rails gets
from `UrlFor`'s `included do ... class_attribute :default_url_options`
(`routing/url_for.rb`). Decide per row whether it is a sanctioned
`@inlinedFrom` constructor segment (RFC 0188) the extra report should not list,
or a redeclaration to delete in favour of the `UrlFor` mixin.

## Acceptance criteria

- `pnpm parity:api:extra --package actiondispatch` lists no row naming a
  `routing/` file.
- No new `@noRailsEquivalent` receipt.
