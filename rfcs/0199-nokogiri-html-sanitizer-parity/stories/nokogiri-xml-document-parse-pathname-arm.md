---
title: "nokogiri-xml-document-parse-pathname-arm"
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

`XmlDocument.parse` (`packages/nokogiri/lib/xml/document.ts`) omits Nokogiri's Pathname arm (`vendor/nokogiri/v1.18.3/lib/nokogiri/xml/document.rb:79-84`): `string_or_io.expand_path.open`, then `url ||= string_or_io.path`. ruby-compat's `Pathname` (`packages/ruby-compat/lib/pathname.ts`) has no `expand_path` and no `read`, so it never reaches the `respond_to?(:read)` arm.

## Acceptance criteria

- [ ] ruby-compat `Pathname` gains `expandPath` / `read` as Ruby's.
- [ ] `parse` ports the Pathname arm, with a test.
