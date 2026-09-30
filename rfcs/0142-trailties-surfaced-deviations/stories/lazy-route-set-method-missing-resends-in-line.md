---
title: "lazy-route-set-method-missing-resends-in-line"
status: draft
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
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

Rails' `LazyRouteSet#method_missing_module` (`vendor/rails/v8.0.2/railties/lib/rails/engine/lazy_route_set.rb:92-110`)
has two methods, and both call `reload_routes_unless_loaded`. `method_missing`
then `public_send`s the name, and `respond_to_missing?` answers `respond_to?`.
So the first `app.routes.url_helpers.root_path` returns `"/"` in the same call
that loads the routes (`railties/test/engine/lazy_route_set_test.rb:17-37`).

trails#8280 (`packages/trailties/src/engine/lazy-route-set.ts`) splices that
module in as a Proxy beneath the generated url helpers module. But
`Application#reloadRoutesUnlessLoaded` is async (`RoutesReloader` loads
`config/routes.ts` through `import()`), so the port can only go part of the way:

- **`respondToMissing`** starts the load (`void`) and answers `super` (`false`),
  so a first read of `rootPath` is `undefined` until the load settles.
- **`method_missing`** is not ported. Its re-send is unreachable while
  `respondToMissing` cannot answer truthfully in the same call.
- **The ported Rails tests** ("app lazily loads routes when invoking url
  helpers" / "... when checking respond_to?", `engine/lazy-route-set.test.ts`)
  await the load before their second assertion.
- **test_help's `action_dispatch_integration_test` `before_setup`**
  (`packages/trailties/src/test-help.ts`) awaits `reloadRoutesUnlessLoaded()`,
  which Rails' `test_help.rb:43-48` does not. It does this so an `IntegrationTest`
  sees its helpers without a synchronous `method_missing` re-send.
- **`LazyRouteSet#routes`** (`lazy_route_set.rb:79-82`) is not overridden.

This depends on `converge-lazy-route-set-sync-ops-to-await-the-reload`. Its
unblock path is an awaited prefetch of the routes files at
`set_routes_reloader_hook` plus a synchronous draw, so that
`execute_unless_loaded` runs in line. That same change lets this module re-send
in line.

## Acceptance criteria

- [ ] `reloadRoutesUnlessLoaded` answers synchronously, via the sibling story's prefetch.
- [ ] `respondToMissing` follows `lazy_route_set.rb:102-108`: `if reload then rbObjRespondTo(...) else super`.
- [ ] `methodMissing` follows `:94-100`: `if reload then rbFPublicSend(...) else super`.
- [ ] The Proxy forwards to `methodMissing` when `respondToMissing` answers, so a first `routes.urlHelpers().rootPath()` returns `"/"`.
- [ ] The two Rails tests assert in one call each, as `lazy_route_set_test.rb:17-37` does, with no `await` between their assertions.
- [ ] The `reloadRoutesUnlessLoaded` await in test-help's integration `before_setup` is removed.
- [ ] `LazyRouteSet#routes` reloads before `super`, per `:79-82`.
- [ ] The CLAUDE.md `lazy_route_set.rb` paragraph that points at this story is updated.
