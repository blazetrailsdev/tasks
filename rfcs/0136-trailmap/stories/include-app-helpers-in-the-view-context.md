---
title: "Include app/helpers in the view context so helper methods work"
status: draft
updated: 2026-09-06
rfc: "0136-trailmap"
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

`app/helpers` is dead weight in a trails app: a helper module defined there is
never reachable from a view, so the Rails idiom for "one place that renders
this bit of markup" — a helper method — cannot be used at all.

Reproduction, against trailmap at the app-shell story:

```ts
// app/helpers/application-helper.ts
export const ApplicationHelper = {
  statusBadge(status: string): string {
    return `<span class="badge s-${status}">${status}</span>`;
  },
};
```

```erb
<%# app/views/home/index.html.tse %>
<p><%= statusBadge("ready") %></p>
```

`GET /` renders `ReferenceError: statusBadge is not defined`, both through
`pnpm dev` and through `ActionController::TestCase`. Adding the include
explicitly — `AbstractController.helper(ApplicationController,
ApplicationHelper)` — does not change the result.

## Why

Two links of Rails' chain are missing.

1. **Nothing includes `app/helpers` into controllers.** Trailties' engine
   initializer `prepend_helpers_path` (`dist/engine.js:258-264`) fills
   `app.config.helpersPaths`, and `helperModulesFromPaths` exists in actionpack
   (`dist/abstract-controller/helpers.js:271`) — but no initializer joins them.
   Rails does this in `ActionController::Railtie`'s `include_all_helpers`.

2. **A controller's `_helpers` never reaches the view.** `ActionView::Base`
   has the porting hook — `Base.withHelpers(helpers)`
   (`actionview/dist/base.js:101`), the `Class.new(klass) { include helpers }`
   arm of Rails' `view_context_class` — and nothing in either package calls it.
   `LookupContext` builds the view from `Base.withEmptyTemplateCache()`
   (`lookup-context.js:599`) with no helpers spliced in, so the `with (this)`
   scope a compiled `.tse` runs under
   (`actionview/dist/template.js:302`) has no helper methods on it.

The second is the load-bearing one: fixing only the first would include the
modules into the controller and still leave views unable to call them.

## The workaround to delete

trailmap's status badge is a partial, `app/views/shared/_status-badge.html.tse`,
rendered as `render({ partial: "shared/status-badge", locals: { status } })`.
A partial is a legitimate Rails shape, so this is not a bad page — but the
normalisation it carries (blank/null status becomes `unknown`) is logic living
in a template because it has nowhere else to go, and `app/helpers` sits empty
in the generated app inviting the next author to hit the same wall.

## Converged shape

`Base.withHelpers` called on the way to the view context, and an
`include_all_helpers` initializer that includes every module under
`config.helpersPaths` into `ActionController::Base`. Then the same
`app/helpers/application-helper.ts` above renders, and trailmap's badge
normalisation moves to a helper the partial calls.
