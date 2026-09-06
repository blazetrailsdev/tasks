---
title: "A controller's render partial: does not split the prefix out of the name"
status: draft
updated: 2026-09-06
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

A controller rendering a partial by a qualified name cannot reach it. Rails
resolves `render partial: "shared/status_badge"` to
`app/views/shared/_status_badge`; trails looks for
`<controller path>/_shared/status-badge` and raises `MissingTemplate`.

Reproduction, from the trailmap app-shell story (trailmap PR #7):

```ts
class BadgeController extends ApplicationController {
  show(): void {
    this.render({ partial: "shared/status-badge", locals: { status: "ready" }, layout: false });
  }
}
```

```text
MissingTemplate: Missing template badge/_shared/status-badge with format "html".
Searched in: FileSystemResolver
```

A leading slash does not help — `partial: "/shared/status-badge"` searches
`badge/_/shared/status-badge`. The only way through is to name the controller
after the partial's directory so the controller path happens to be the prefix,
which is what trailmap's `test/views/status-badge.test.ts` does today, with a
comment saying so.

## Why

`ActionController::Base#renderAsync` normalizes the name for a template and
not for a partial:

```ts
// packages/actionpack/src/action-controller/base.ts:400-417
if (options.partial !== undefined) {
  ...
  this.body = await ctx.renderPartial(options.partial, controllerPrefix, format, locals, view);
} else {
  const [action, prefixes] = ctx.normalizeName(template, ...);   // <- only this arm
  this.body = await ctx.render(prefixes, action, formats, locals, ...);
}
```

`LookupContext#renderPartial(name, prefix, ...)`
(`packages/actionview/src/lookup-context.ts:514-530`) then hands
`findPartial(name, [prefix], [format])` the whole `"shared/status-badge"` as
the NAME, so the slash inside it is never split out.

Rails does the split for both arms. `_normalize_options`
(`actionview/lib/action_view/rendering.rb`) sends the partial through
`TemplatePath.parse`, which peels the last segment as the name and the rest as
the prefix, exactly as it does for a template. `normalizeName` is already
ported here (`lookup_context.rb:209-225`) — it is simply not called on this
path.

Note the same call site passes ONE `controllerPrefix` rather than
`_prefixes`, so a partial in `app/views/application/` is unreachable from a
subclass controller too — the partial-arm analogue of what
`lookup-context-render-takes-rails-prefixes-and-formats` fixed for templates.

## Acceptance criteria

- `render({ partial: "shared/status-badge" })` from any controller resolves
  `app/views/shared/_status-badge`, and an unqualified `partial: "row"`
  still resolves against the controller's prefixes.
- The partial arm passes the controller's `_prefixes` chain, not one
  `controllerPath()`, so `app/views/application/_x` is reachable from a
  subclass.
- A test covers a qualified partial name rendered from a controller whose path
  is unrelated to the partial's directory.
- trailmap's workaround is removable: the test controller in
  `test/views/status-badge.test.ts` no longer has to be named for the
  partial's directory.
