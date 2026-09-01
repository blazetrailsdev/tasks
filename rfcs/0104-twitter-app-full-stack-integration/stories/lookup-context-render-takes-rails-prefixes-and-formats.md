---
title: "lookup-context-render-takes-rails-prefixes-and-formats"
status: draft
updated: 2026-09-01
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`LookupContext#render(controller, action, format, locals, options)` and its
neighbours `findTemplate(name, prefix, format)` / `findPartial` / `findLayout`
(`packages/actionview/src/lookup-context.ts`) each take ONE format string and
ONE prefix string. Rails takes neither.

Rails' entry points are `find(name, prefixes = [], partial = false, keys = [],
options = {})` and `find_all` (`lookup_context.rb:129-146`), which pass the
whole registered-details hash — `locale`, `formats`, `variants`, `handlers` —
down through `args_for_lookup` to the resolver, and `prefixes` is a LIST because
`ActionView::Rendering#_normalize_options` fills it from `_prefixes`, the
controller's whole inheritance chain (`PostsController` then
`ApplicationController`). Narrowing to `formats: [oneFormat]` throws away the
`*/*` -> `[:html, :text, :js, :css, :xml, :json]` cascade that
`LookupContext#formats=` (`lookup_context.rb:263-280`) just computed, and
narrowing to one prefix means a view inherited from `app/views/application/` is
never found.

`LookupContext#findAll` / `#find` / `#isExists` / `#isAny` already take
`prefixes` as a list and already route through the ported `normalizeName`
(`lookup_context.rb:209-225`), so the narrow signatures are the outlier, not the
rule. Surfaced while fixing
`generated-app-cannot-render-its-own-views`: `renderAsync` in
`packages/actionpack/src/action-controller/base.ts` has to pick
`this.formats[0]` and pass a single `prefixes[0]` to satisfy them, and the call
site carries a comment saying so.

## Acceptance criteria

- `LookupContext#render` / `#findTemplate` / `#findPartial` / `#findLayout`
  take the details the Rails signature takes — `prefixes` as a list, and the
  formats cascade rather than a single format — or are deleted in favour of the
  already-Rails-shaped `find` / `findAll`.
- `ActionController::Base#renderAsync` passes `_prefixes` (the controller's
  inheritance chain, `view_paths.rb:_prefixes`) rather than one
  `controllerPath()`, and stops picking `formats[0]`; the comment at that call
  site explaining the narrowing is deleted.
- A test covers an action whose template lives in `app/views/application/`,
  found through the inherited prefix.
