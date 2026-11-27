---
title: "playground-preview-shows-500-page"
status: draft
updated: 2026-11-27
rfc: "0136-trailmap"
cluster: null
est-loc: 150
packages:
  - website
deps:
  - move-browser-sqlite-into-website-as-playground
deps-rfc: []
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

When the hosted app raises, the playground's request handler (`examples/browser-sqlite/src/runtime/main.ts:250-257`) catches it and answers 500 with a bare `<pre>` of the formatted error, so the preview iframe shows raw text instead of an error page. Rails answers an exception with `ActionDispatch::ShowExceptions` / `DebugExceptions` (`vendor/rails/v8.0.5.2/actionpack/lib/action_dispatch/middleware/show_exceptions.rb`, `debug_exceptions.rb`): the dev debug page in development, or `public/500.html` through `PublicExceptions`.

## Acceptance criteria

- An exception in the hosted app renders a proper 500 page in the preview iframe, via the app's exception middleware (debug page in development, `public/500.html` otherwise), not the bare `<pre>` fallback.
- The bare `<pre>` arm remains only for an error raised outside the app's middleware stack (e.g. boot).
- The console still logs the request as `→ 500`; smoke covers a raising route.
