---
title: "nokogiri-html5-document-fragment-gumbo-fragment"
status: draft
updated: 2026-11-08
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

`HTML5::DocumentFragment`'s constructor (`packages/nokogiri/lib/html5/document-fragment.ts`) ports `Nokogiri::HTML5::DocumentFragment#initialize` (`vendor/nokogiri/v1.18.3/lib/nokogiri/html5/document_fragment.rb:144-167`). Rails ends with `Nokogiri::Gumbo.fragment(self, input, context, **options)` (`:166`), the native Gumbo fragment parser. trails calls parse5's `parseFragment` inline instead, and the body also skips the `max_errors` / `max_tree_depth` / `max_attributes` / `parse_noscript_content_as_text` option reads (`:150-165`). The call is receipted `@missingRailsCall fragment — CONVERGEABLE nokogiri-html5-document-fragment-gumbo-fragment`. It surfaced in trails#9891, once `XML::Node#fragment` existed under the same name.

## Acceptance criteria

- [ ] A `Gumbo.fragment(doc_fragment, input, context, options)` seat (backed by parse5) is ported, and the constructor calls it as Rails does, reading the options as `:150-165` does.
- [ ] The receipt is deleted.
