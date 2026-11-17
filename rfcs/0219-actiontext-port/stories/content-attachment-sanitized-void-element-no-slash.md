---
title: "content-attachment-sanitized-void-element-no-slash"
status: ready
updated: 2026-11-17
rfc: "0219-actiontext-port"
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

`vendor/rails/v8.0.2/actiontext/test/unit/attachment_test.rb`, "to_trix_html
sanitizes action-text HTML content attachment", expects the sanitized
`content` to serialize `<img src=".">` (HTML5 void element, no slash). trails
emits `<img src="." />`, so `Content#to_trix_html`
(`packages/actiontext/lib/content.ts`) differs from Rails. The slash comes from
the sanitizer / HTML serialization path the content attachment's `content`
goes through (`ContentAttachment.from_node`, rails-html-sanitizer port).

Reproducer: `packages/actiontext/test/unit/attachment.test.ts` (parked
`it.skip` citing this story).

## Acceptance criteria

- A sanitized HTML5 void element serializes without the trailing slash, as Loofah/Nokogiri
  HTML5 does.
- The test is un-skipped and passes.
