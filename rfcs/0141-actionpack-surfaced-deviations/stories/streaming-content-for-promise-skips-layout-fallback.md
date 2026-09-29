---
title: "streaming-content-for-promise-skips-layout-fallback"
status: draft
updated: 2026-09-29
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

`ActionView::Helpers::CaptureHelper#content_for` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/capture_helper.rb`)
returns the stored String, or `nil` when it is blank. That holds on the streaming path too:
`ActionView::StreamingFlow#get` (`vendor/rails/v8.0.2/actionview/lib/action_view/flows.rb`)
suspends the layout's fiber until the view provides the content, then returns the String.
So the generated layout's `content_for(:title) || "Blog"`
(`railties/lib/rails/generators/rails/app/templates/app/views/layouts/application.html.erb.tt:4`)
falls back when streaming as well.

trails' `contentFor` (`packages/actionview/src/helpers/capture-helper.ts:66-69`) returns a
`Promise<SafeBuffer | null>` when the flow is a `StreamingFlow` (`packages/actionview/src/flows.ts:60-82`).
The streaming TSE emitter (`packages/tse-compiler/src/emit-js.ts:234`, `awaits`) awaits a whole
`<%= %>` expression, so `contentFor("title") ?? "Blog"` evaluates `??` against the Promise, never
falls back, and a streamed page with no title renders `<title></title>`. The generated layout
ported in trails#8255 takes this form.

## Acceptance criteria

- On a streamed render, a layout's `<%= contentFor("title") ?? "Fallback" %>` renders `Fallback`
  when no view provided a title. Either the streaming emitter awaits `contentFor` before the
  fallback operator applies, or `contentFor`'s streaming arm is expressed so that it does.
- A trails test renders the generated application layout with `stream: true` and no title, and
  asserts the app-name fallback.
