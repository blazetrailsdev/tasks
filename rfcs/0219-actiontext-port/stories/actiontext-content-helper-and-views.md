---
title: "Port ContentHelper and the ActionText view templates"
status: in-progress
updated: 2026-11-12
rfc: "0219-actiontext-port"
cluster: at-views
packages: ["actiontext"]
deps: ["actiontext-content-and-rendering", "activestorage-variation-and-variants"]
deps-rfc: []
est-loc: 400
priority: null
pr: trails#10022
claim: "2026-11-12T13:41:33Z"
assignee: "actiontext-content-helper-and-views"
blocked-by: null
closed-reason: null
---

## Context

- `vendor/rails/v8.0.2/actiontext/app/helpers/action_text/content_helper.rb` (76): `mattr_accessor
:sanitizer` defaulting to `Rails::HTML4::Sanitizer.safe_list_sanitizer.new`
  (`:9`), `allowed_tags`, `allowed_attributes`, `scrubber`,
  `render_action_text_content`, `sanitize_content_attachment`,
  `sanitize_action_text_content`, `render_action_text_attachments` (gallery
  arm uses `render(layout:, object:)` with a block, `:37-52`),
  `render_action_text_attachment`, `sanitizer_allowed_tags`,
  `sanitizer_allowed_attributes`.
- `app/views/action_text/**` and `app/views/layouts/action_text/**` (six ERB
  files) and `app/views/active_storage/blobs/_blob.html.erb` (14, calls
  `blob.representation(resize_to_limit: …)`).
- `packages/html-sanitizer` has `HTML4.SafeListSanitizer` and the HTML5
  vendors (`html-sanitizer-port-html5-vendor`, done).

## Acceptance criteria

- `ContentHelper` is a plain-object module with its four `mattr_accessor`s;
  `sanitizer` defaults to the HTML4 safe-list sanitizer as Rails does (the
  engine's `after_initialize` swaps the vendor).
- The seven templates are `.tse` files at the Rails paths, built by
  `build-views --in-place` (CLAUDE.md § "Templates are precompiled").
- `render_action_text_attachments` awaits each `render` and keeps
  `.chomp` / `.html_safe` where Rails has them.
- Covered by the `content_test.rb` rendering tests and the integration
  tests; any helper-only assertion missing there goes in a `.trails.test.ts`.
