---
title: "tse-block-expression-passes-ruby-block"
status: draft
updated: 2026-11-22
rfc: "0142-trailties-surfaced-deviations"
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

A TSE block expression, `<%= helper(args, () => { %> ... <% }) %>`, compiles to a plain arrow
(packages/tse-compiler/lib/emit-js.ts). Helpers ported with a trailing Ruby block over a splat read it with
`rbBlockGivenP`, which needs ruby-compat's `block()` marker, so `turboFrameTag("thread", () => { %>...`
(packages/turbo/lib/app/helpers/turbo/frames-helper.ts:21-22) takes the arrow as an id and renders
`<turbo-frame id="thread_async () => {...">`. ERB's `<%= turbo_frame_tag "thread" do %>` passes a block.
examples/chatter's threads/show.html.tse writes the `<turbo-frame>` element by hand as a workaround.

## Acceptance criteria

- A block expression's arrow reaches the helper as a Ruby block (`rbBlockGivenP` true) without breaking
  helpers that take a positional function (`formWith`).
- `turboFrameTag("tray", () => { %>...<% })` in a .tse renders the frame around the block's content.
