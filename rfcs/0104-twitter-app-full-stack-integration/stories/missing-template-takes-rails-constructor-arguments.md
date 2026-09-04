---
title: "MissingTemplate takes Rails' (paths, path, prefixes, partial, details) constructor"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`MissingTemplate`'s constructor in `packages/actionview/src/lookup-context.ts`
is `(controller, action, format, searchedPaths, candidatePaths)` and its
`path` / `paths` / `prefixes` / `partial` / `templateKeys` readers are still
carrying `@internal stub - real impl in Phase 1d` tags.

Rails' is
`MissingTemplate#initialize(paths, path, prefixes, partial, details, *)`
(`vendor/rails/actionview/lib/action_view/template/error.rb:41-66`): `prefixes`
is a LIST, there is no `controller` or `format` parameter at all, the message
is built from `@prefixes.map { |prefix| [prefix, path].join("/") }` plus
`details.inspect`, and `partial` rewrites the basename to `_basename` rather
than the caller passing `` `_${name}` `` in.

`lookup-context-render-takes-rails-prefixes-and-formats` (#7454) made
`LookupContext#render` take `prefixes` and the formats cascade, which sharpened
this: `render` now has to collapse both back down —
`String(prefixes[0] ?? "")` and `String(formats[0] ?? "html")` — purely to feed
the narrow constructor, throwing away exactly the detail the story had just
threaded through. Four other call sites in the same file do the same, and
`renderPartial` / `renderPartialSync` pre-underscore the action.

## Converged shape

`new MissingTemplate(paths, path, prefixes, partial, details)`, with the
message assembled per `error.rb:57-64` and the `_`-rewrite moved inside the
constructor (`error.rb:43-45`). The five `@internal stub` readers become the
real `attr_reader :path, :paths, :prefixes, :partial` (`error.rb:42`). The
existing `corrections` / `candidatePaths` DidYouMean surface stays; it already
mirrors `error.rb:68-118`.

## Acceptance criteria

- `MissingTemplate`'s constructor takes Rails' parameters in Rails' order and
  builds Rails' message; no call site synthesizes a `controller` or a single
  `format` to reach it.
- The `Phase 1d` stub tags on `path` / `paths` / `prefixes` / `partial` /
  `templateKeys` are gone, backed by real values.
- The partial `_` rewrite happens in the constructor, not at the call sites.
