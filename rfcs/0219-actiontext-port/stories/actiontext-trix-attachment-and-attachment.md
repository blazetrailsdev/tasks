---
title: "Port TrixAttachment, Attachment, AttachmentGallery and the Attachments mixins"
status: ready
updated: 2026-11-07
rfc: "0219-actiontext-port"
cluster: at-content
packages: ["actiontext"]
deps: ["actiontext-module-fragment-and-conversions"]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `vendor/rails/v8.0.2/actiontext/lib/action_text/trix_attachment.rb` (94): `TAG_NAME`, `SELECTOR`,
  `COMPOSED_ATTRIBUTES`, `ATTRIBUTES`, the `ATTRIBUTE_TYPES` lambdas
  (`:12-18`, `Integer(value.to_s, exception: false)`), `from_attributes`,
  `attributes`, and `read_json_attribute` logging through `Rails.logger`
  on a parse failure (`:82-92`).
- `lib/action_text/attachment.rb` (148): `mattr_accessor :tag_name` (`:22`),
  `ATTRIBUTES`, the class methods (`:26-61`), `delegate :to_param` and
  `delegate_missing_to :attachable` (`:65-66`), `full_attributes`,
  `with_full_attributes`, `to_plain_text`'s `respond_to?` arm (`:110-116`),
  `inspect`, and the memoized private attribute readers (`:135-146`).
- `lib/action_text/attachments/{caching,minification,trix_conversion}.rb`
  (18, 19, 38): `cache_key` over `OpenSSL::Digest::SHA256.hexdigest`,
  `fragment_by_minifying_attachments`, `fragment_by_converting_trix_attachments`,
  `to_trix_attachment` and the render-reaching `trix_attachment_content`
  (`trix_conversion.rb:31-35`).
- `lib/action_text/attachment_gallery.rb` (72): `include ActiveModel::Model`,
  `private_constant :TAG_NAME`, the `:has(...)` selector (`:47-49`).

## Acceptance criteria

- `Attachment` includes the three mixins with `include()`, their
  `class_methods` halves through `extend()`; `tag_name` is a
  `mattr_accessor` with Rails' default.
- `delegate_missing_to :attachable` is `delegateMissingTo`, and the row is
  added to CLAUDE.md's `method_missing` table.
- `trix_attachment_content` returns what `ActionText::Content.render`
  returns, per the RFC's "Rendering is async where ActionView's is".
- `ATTRIBUTE_TYPES` keeps the `:default` key's Symbol-ness as Rails does
  (CLAUDE.md § "A Ruby Symbol is a JS string"): the lookup misses every
  string key and falls back.
- `private_constant` is not ported (CLAUDE.md § "Method visibility is
  compile-time only"); `TAG_NAME` is module-private.
