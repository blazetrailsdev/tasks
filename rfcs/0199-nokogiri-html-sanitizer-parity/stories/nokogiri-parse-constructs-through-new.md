---
title: "nokogiri: parse through new, as XML::Document.parse and HTML5::DocumentFragment.parse do"
status: in-progress
updated: 2026-11-08
rfc: "0199-nokogiri-html-sanitizer-parity"
cluster: null
packages: ["nokogiri"]
deps: []
deps-rfc: []
est-loc: 150
priority: 2
pr: trails#9865
claim: "2026-11-08T12:45:20Z"
assignee: "nokogiri-xml-node-children-writer"
blocked-by: null
---

## Context

trails#9825 scores nokogiri in `parity:api`. Two class-level `parse` methods build their result differently from the gem:

- `HTML5::DocumentFragment.parse` calls `new(document, input, context, options)` and lets `initialize` do the parsing (`vendor/nokogiri/v1.18.3/lib/nokogiri/html5/document_fragment.rb:80-84`). `packages/nokogiri/lib/html5/document-fragment.ts` parses first and passes the finished children to the constructor.
- `XML::Document.parse` wraps an Integer in `ParseOptions.new(options)` and returns an empty `new` for empty input (`xml/document.rb:61,70`). `packages/nokogiri/lib/xml/document.ts` builds an `XmlDocument` from the DOM parser's result and its errors.

Both sites carry `@missingRailsArgs new — CONVERGEABLE nokogiri-parse-constructs-through-new`.

## Acceptance criteria

- [ ] `DocumentFragment` takes `(document, input, context, options)` and parses in its constructor.
- [ ] `XmlDocument.parse` accepts a `ParseOptions` or an Integer and constructs through `new` as Ruby does.
- [ ] The receipts are deleted, and `pnpm parity:api:calls:args` stays green.
