---
title: "LookupContext has two incompatible resolver protocols; the Rails-shape lookup API is unreachable"
status: draft
updated: 2026-08-13
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["actionview", "actionpack"]
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

`LookupContext` carries two incompatible resolver protocols, and which half
you get depends on how the context was constructed. The Rails-shape lookup
API is unreachable from the path controllers actually use.

- **Rails-shape half.** `find` / `findAll` / `isExists` / `isAny`
  (`packages/actionview/src/lookup-context.ts:429-475`) all delegate to
  `this._viewPaths`, a `PathSet` of `PathSetResolver`
  (`packages/actionview/src/path-set.ts:28`). These take `prefixes` as an
  array and an `options` bag, so they honour `variants:` and the full
  details cascade, exactly as `lookup_context.rb:141-153`.
- **Trails half.** `addResolver` (`lookup-context.ts:533`) pushes onto
  `this.resolvers`, a `TemplateResolver`
  (`packages/actionview/src/resolver/resolver.ts:14`) whose sole lookup is
  `find(name, prefix, format, extensions)` — one prefix, one format, no
  variants, no details. `findTemplate` / `render` / `renderPartial` read this
  list.

Nothing bridges them: a context built with `addResolver` has an empty
`_viewPaths`, so `isExists` / `isAny` always answer false for it. The dev
server (`packages/trailties/src/server/application.ts#setupViews`) and
`examples/twitter-app` both wire views through `addResolver`, so the
controller's template lookup necessarily goes through the narrow protocol.

The visible cost is in `ActionController::Base#templateExists` /
`#anyTemplates`, which must sweep prefixes and formats by hand instead of
calling `isExists` / `isAny`, and cannot pass `variants: request.variant` at
all — Rails does
(`vendor/rails/actionpack/lib/action_controller/metal/implicit_render.rb:37`).
That gap is the one remaining `kind: "args"` row in
`scripts/api-compare/call-mismatches-exclude/actioncontroller/metal/implicit-render.json`.

## Acceptance criteria

- One resolver protocol. Either `TemplateResolver` grows the details/prefixes
  surface `PathSetResolver` has, or the concrete resolvers
  (`FileSystemResolver`, `OptimizedFileSystemResolver`, `InMemoryResolver`)
  implement `PathSetResolver` and `addResolver` appends to `_viewPaths`
  (Rails' `append_view_paths`).
- `findTemplate` / `render` / `renderPartial` resolve through the same paths
  as `isExists` / `isAny`.
- `Base#templateExists` delegates to `isExists` and passes
  `variants: request.variant`; `Base#anyTemplates` delegates to `isAny`.
- The `variants:` row in the implicit-render call-arg baseline is deleted.
