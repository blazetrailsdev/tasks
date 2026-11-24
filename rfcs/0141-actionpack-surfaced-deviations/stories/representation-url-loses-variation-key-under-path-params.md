---
title: "Representation URL loses variation key under request path params"
status: draft
updated: 2026-11-24
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionpack"]
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

In `examples/electron-writebook`, rendering a picture leaf (`app/views/leafables/show.html.tse`, `imageTag(leafable.largeImage())`, a `VariantWithRecord`) from the slugged route `/:book_id/:book_slug/:id/:slug` raises `No route matches {:action=>"show", :book_id=>"1", ..., :controller=>"active_storage/representations/redirect", ..., :variation_key=>nil}`, though `variant.variation.key` answers a string. The `trails_storage_redirect` direct (`packages/activestorage/lib/config/routes.ts:130-160`) passes `signedBlobId, variationKey, filename` positionally to `routeFor`; `RouteSet::NamedRouteCollection::UrlHelper#handlePositionalArgs` (`packages/actionpack/lib/action-dispatch/routing/route-set.ts:413-446`) keeps an invented `args[at] !== null` arm Rails' `handle_positional_args` (`vendor/rails/v8.0.5.2/actionpack/lib/action_dispatch/routing/route_set.rb:292-318`) lacks. `test/integration/pages.test.ts`'s "shows a picture page with its large variant" is `it.skip`.

## Acceptance criteria

- A representation URL generated during a request whose path params include `id` / `book_id` carries its variation key.
- An actionpack regression test reproduces it and fails before the fix.
- The `it.skip` in `examples/electron-writebook/test/integration/pages.test.ts` runs and passes.
