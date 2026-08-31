---
title: "port-view-context-class-on-controller"
status: ready
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
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

Rails builds the view class on the CONTROLLER, not on `ActionView::Base`:
`Rendering::ClassMethods#view_context_class` /
`#build_view_context_class(klass, supports_path, routes, helpers)`
(`vendor/rails/actionview/lib/action_view/rendering.rb:52-73`) returns
`Class.new(klass) { include routes.url_helpers(...); include helpers }`, memoized
per controller class, and `Rendering#view_context` instantiates it.

trails has no `viewContextClass`. `Base.withHelpers(helpers)`
(`packages/actionview/src/base.ts`, added by the ActionView::Base port) covers
only the `include helpers` arm and lives on `Base` rather than on the
controller, so it carries a `@noRailsEquivalent CONVERGEABLE` receipt pointing
here. Missing with it:

- the memoization per controller class (`@view_context_class ||=`) and the
  `inherit_view_context_class?` early return (`rendering.rb:60-62`), so every
  render currently rebuilds the subclass;
- both `routes` arms — `include routes.url_helpers(supports_path)` and
  `include routes.mounted_helpers` (`rendering.rb:65-68`), so URL helpers
  (`postsPath`) are not reachable from a template even though
  `helper_method` proxies now are;
- `DetailsKey.view_context_class` as the base class (`rendering.rb:53`).

## Converged shape

Port `viewContextClass` / `buildViewContextClass` onto the controller-side
`Rendering` module per `rendering.rb:52-73`, with the same memoization and the
same two `include` arms, and have the renderer instantiate it. `withHelpers`
then folds into it and its receipt is deleted.

## Acceptance criteria

- `buildViewContextClass` matches `rendering.rb:59-73` branch for branch,
  including the `inherit_view_context_class?` early return.
- The view class is memoized per controller class.
- A route helper is callable as a bare identifier in a template.
- `Base.withHelpers` and its `@noRailsEquivalent` receipt are gone.
