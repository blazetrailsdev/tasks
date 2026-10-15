---
title: "debug-view-extends-action-view-base-and-renders-rescue-templates"
status: ready
updated: 2026-10-15
rfc: "0165-actiondispatch-middleware-parity"
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

Left over from `exceptions-debug-view-and-remote-ip-missing-members`. In
`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/`:

- `class DebugView < ActionView::Base` (`debug_view.rb:11`) builds an
  `ActionView::LookupContext` over `RESCUES_TEMPLATE_PATHS` (`:14-18`) and
  overrides `render(*)` to silence `ActionView::Base.logger` (`:48-56`).
  `packages/actionpack/src/action-dispatch/middleware/debug-view.ts` has no
  parent class and no `render`, and its `RESCUES_TEMPLATE_PATHS` points at a
  `./templates` directory that does not exist.
- `DebugExceptions#create_template(request, wrapper)` (`debug_exceptions.rb:116`)
  is missing. `render_for_browser_request` (`:78`) renders through it, but in
  `packages/actionpack/src/action-dispatch/middleware/debug-exceptions.ts` it
  hand-assembles an HTML string and calls an invented `escapeHtml`.
- `HostAuthorization::DefaultResponseApp#response_body` (`host_authorization.rb:100-105`)
  renders `rescues/blocked_host` through `DebugView`. trails uses the
  module-private `renderBlockedHostHtml` / `renderBlockedHostText`, chosen by
  `request.xhr`.
- The rescue/routes templates (`templates/rescues/*.erb`, `templates/routes/*`,
  `templates/layout.erb`, about 950 lines) are not ported. They need `.tse`
  equivalents under `middleware/templates/`.

## Acceptance criteria

- `DebugView` extends actionview's `Base` and gets its lookup context over
  `RESCUES_TEMPLATE_PATHS`, as `debug_view.rb:14-18` does; `render` ports `:48-56`.
- The rescue templates are ported as `.tse` files at Rails' paths.
- `DebugExceptions#createTemplate` exists, and `renderForBrowserRequest` follows
  `debug_exceptions.rb:78-114`; `escapeHtml` is gone.
- `DefaultResponseApp#responseBody` renders `rescues/blocked_host` through
  `DebugView`; `renderBlockedHostHtml` / `renderBlockedHostText` / `escapeHtml` are gone.
- `pnpm parity:api` reports `debug_view.rb` and `debug_exceptions.rb` at 100%
  with no inheritance row.
