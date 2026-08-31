---
title: "LookupContext has two incompatible resolver protocols; the Rails-shape lookup API is unreachable"
status: claimed
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["actionview", "actionpack"]
deps: []
deps-rfc: []
est-loc: null
priority: 25
pr: null
claim: "2026-08-31T14:13:41Z"
assignee: "unify-lookup-context-resolver-protocols"
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
`#anyTemplates`, which sweep prefixes and formats by hand instead of calling
`isExists` / `isAny`. Variant support was ported into the narrow protocol
(`TemplateResolver.find` takes `variants`, `FileSystemResolver` prefers
`name.format+variant.ext`), so no parity suppression remains — but the work is
now duplicated: the same capability exists once per protocol, and the rest of
the details cascade (locale, handlers) is still only on the `_viewPaths` half.

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
- Variant lookup is implemented once, not once per protocol.
