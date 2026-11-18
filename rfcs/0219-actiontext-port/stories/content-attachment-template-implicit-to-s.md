---
title: "ContentAttachment template renders attachable via implicit to_s, not await toString()"
status: ready
updated: 2026-11-18
rfc: "0219-actiontext-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `actiontext/app/views/action_text/attachables/_content_attachment.html.erb`
(`vendor/rails/v8.0.2/actiontext/app/views/action_text/attachables/_content_attachment.html.erb`)
is `<%= content_attachment.attachable %>`, which calls `ContentAttachment#to_s` → `to_html`
(`vendor/rails/v8.0.2/actiontext/lib/action_text/attachables/content_attachment.rb:24-30`).

Since trails#10279, `ContentAttachment#contentInstance` awaits `Content.new` (async `static new`,
trails#10276), so `toHtml` / `toString` return promises and
`packages/actiontext/app/views/action-text/attachables/_content_attachment.html.tse` writes
`<%= await content_attachment.attachable.toString() %>`. The explicit `await …toString()` is a
template-level deviation without a receipt.

## Acceptance criteria

- The template reads as Rails' `<%= content_attachment.attachable %>`, with the async `to_s`
  settled by the TSE output path (or a ratified repo-wide rule for awaiting a promise-valued
  `to_s` in `<%= %>`), not by a per-template `await …toString()`.
- "renders content attachment" (`packages/actiontext/test/unit/attachment.test.ts`) still passes.
