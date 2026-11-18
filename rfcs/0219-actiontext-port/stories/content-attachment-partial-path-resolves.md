---
title: "content-attachment-partial-path-resolves"
status: done
updated: 2026-11-18
rfc: "0219-actiontext-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10279
claim: "2026-11-17T22:06:43Z"
assignee: "content-attachment-partial-path-resolves"
blocked-by: null
closed-reason: null
---

## Context

`ActionText::Attachables::ContentAttachment#to_html`
(`vendor/rails/v8.0.2/actiontext/lib/action_text/attachables/content_attachment.rb`)
renders `content_instance` through `Content#render`, whose object partial is
`Content#to_partial_path` = `"action_text/contents/content"`
(`vendor/rails/v8.0.2/actiontext/lib/action_text/content.rb`). In trails the
lookup asks for `action-text/contents/_content` and raises
`ActionView::MissingTemplate`, although `packages/actiontext/app/views/action_text/contents/_content.html.tse`
exists. Meanwhile `app/views/action-text/attachables/` is dasherized, so the
two view dirs disagree on the spelling.

Reproducer: `packages/actiontext/test/unit/attachment.test.ts`, "renders content
attachment" (parked `it.skip` citing this story).

## Acceptance criteria

- The object partial for an `ActionText::Content` resolves to the shipped
  `_content` template, and the actiontext view dirs use one spelling.
- "renders content attachment" is un-skipped and passes.
