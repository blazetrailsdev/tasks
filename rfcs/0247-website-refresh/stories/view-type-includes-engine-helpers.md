---
title: "view-type-includes-engine-helpers"
status: in-progress
updated: 2026-11-22
rfc: "0247-website-refresh"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10580
claim: "2026-11-22T16:54:09Z"
assignee: "attached-one-types-delegated-attachment-members"
blocked-by: null
closed-reason: null
---

## Context

turbo-rails' `turbo.helpers` initializer (`vendor/turbo-rails/v2.0.23/lib/turbo/engine.rb:55-58`) runs
`helper Turbo::Engine.helpers` on `ActionController::Base`, so every view answers `turbo_stream_from`.
trails-tsc's `templateScope` (`packages/trails-tsc/lib/build-views.ts`, the `view` array) types a view as
`ActionView::Base` plus the app's own `app/helpers/*-helper.ts` modules only, so an engine's helpers
(`Turbo.StreamsHelper`, `packages/turbo/lib/app/helpers/turbo/streams-helper.ts`) are absent and
`<%= turboStreamFrom(post.author) %>` in `examples/homepage/app/views/posts/show.html.tse` reports
TS2349 (`Type 'never' has no call signatures`).

## Acceptance criteria

- A view shim's `View` type includes the helpers an engine installs through `helper Engine.helpers`.
- `examples/homepage/app/views/posts/show.html.tse` compiles without the TS2349 at (1,5); drop that row from
  the expected list in `packages/website/src/lib/landing-samples.test.ts`.
