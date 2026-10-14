---
title: "debug-exceptions-renders-rescues-templates"
status: draft
updated: 2026-10-14
rfc: "0141-actionpack-surfaced-deviations"
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

`DebugExceptions#render_for_browser_request`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/debug_exceptions.rb:80-91`)
renders `rescues/#{wrapper.rescue_template}` through `create_template` (`:93-112`), as
`rescues/layout` for HTML or `formats: [:text]` for XHR. trails'
`renderForBrowserRequest` (`packages/actionpack/src/action-dispatch/middleware/debug-exceptions.ts`)
builds the body inline, because the `action_dispatch/middleware/templates/rescues/*`
templates and `create_template` / `DebugView` are not ported.

## Acceptance criteria

- [ ] `createTemplate` is ported, and the `rescues/*` and `routes/*` templates are ported as `.tse`.
- [ ] `renderForBrowserRequest` renders `rescues/<rescueTemplate>` with Rails' layout and format
      arms. The inline HTML and text bodies and `escapeHtml` are gone.
