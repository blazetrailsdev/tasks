---
title: "UrlHelpersModule copies the named-route helper modules where Ruby includes them"
status: draft
updated: 2026-09-08
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`UrlHelpersModule`'s constructor copies the named-route helpers rather than
linking them
(`packages/actionpack/src/action-dispatch/routing/route-set.ts:394-397`):

```ts
Object.assign(this, routes.namedRoutes.urlHelpersModule);
if (supportsPath) {
  Object.assign(this, routes.namedRoutes.pathHelpersModule);
}
```

Ruby includes them, so the generated module is live against every later
`NamedRouteCollection#add`
(`actionpack/lib/action_dispatch/routing/route_set.rb:600,606`):

```ruby
url_helpers = routes.named_routes.url_helpers_module
extend url_helpers
include url_helpers

if supports_path
  path_helpers = routes.named_routes.path_helpers_module
  include path_helpers
  extend path_helpers
end
```

`NamedRouteCollection#add` calls `define_url_helper` into exactly those two
modules (`route_set.rb:119-136,335-347`), which is why a Ruby module built
before `config/routes.rb` is drawn still answers `posts_path` afterwards.

Because the TS copy is a snapshot, `RouteSet` compensates by dropping the
`_urlHelpersWithPaths` / `_urlHelpersWithoutPaths` memo at every route-add
site (`route-set.ts:674-675,698-699,993-994`) so the next `urlHelpers()` call
rebuilds the whole module. That workaround is load-bearing today: PR #7616
made the controller wiring re-resolve through `urlHelpers()` on each access
precisely so the rebuild is observed.

Surfaced by `controller-url-helpers-snapshot-before-routes-are-drawn`
(PR #7616), which fixed the controller-side snapshot but left this one, the
snapshot one level down.

## Converged shape

`UrlHelpersModule` links the two helper modules instead of copying them, so a
helper defined after the module is constructed is visible without rebuilding
it — the liveness Ruby gets from `include`. With that in place the memo drops
at `route-set.ts:674-675,698-699,993-994` become unnecessary for helper
freshness and should be re-examined (they may still be needed for the Journey
router reset alongside them).

## Acceptance criteria

- [ ] `UrlHelpersModule` does not `Object.assign` from
      `namedRoutes.pathHelpersModule` / `urlHelpersModule`.
- [ ] A helper added by `RouteSet#addRoute` after a `UrlHelpersModule` is
      constructed is answered by that same module instance, without going
      through `urlHelpers()` again.
- [ ] The `controller-url-helpers-snapshot-before-routes-are-drawn` cover in
      `packages/trailties/src/application.test.ts` stays green.
- [ ] The memo-drop sites are either justified against what still needs them or
      removed.
