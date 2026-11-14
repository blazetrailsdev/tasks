---
title: "html4-sanitizer-uri-escapes-attributes-like-libxml2"
status: draft
updated: 2026-11-14
rfc: "0199-nokogiri-html-sanitizer-parity"
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

`ActionText::ContentHelper#sanitize_content_attachment` runs `Rails::HTML4::SafeListSanitizer#sanitize`. In MRI (rails-html-sanitizer + Loofah over libxml2), `sanitize('<img src="\&quot;.\&quot;" onerror=alert>')` answers `<img src="\%22.\%22">`, and `sanitize('<img src="a b">')` answers `<img src="a%20b">`. trails' `HTML4.SafeListSanitizer` (`packages/html-sanitizer`) answers `<img src="\&quot;.\&quot;" />` and `<img src="a b" />`. Two things differ: libxml2's HTML serializer (`htmlAttrDumpOutput`) URI-escapes `src` / `href` values, and an HTML4 void element is written with a trailing slash (`<img ... />`).

This blocks `vendor/rails/v8.0.2/actiontext/test/unit/content_test.rb` "sanitizes attachment markup for Trix" (`:162-166`), which is `it.skip` in `packages/actiontext/test/unit/content.test.ts`.

## Acceptance criteria

- HTML4 sanitizer output URI-escapes `src` / `href` attribute values the way libxml2's HTML serializer does, and writes void elements as `<img ...>`.
- "sanitizes attachment markup for Trix" in `packages/actiontext/test/unit/content.test.ts` runs and passes.
