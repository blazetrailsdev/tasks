---
title: "nokogiri-xml-document-parse-empty-pathname"
status: ready
updated: 2026-11-25
rfc: "0199-nokogiri-html-sanitizer-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`XmlDocument.isEmptyDoc` (`packages/nokogiri/lib/xml/document.ts`) ports `empty_doc?` (`vendor/nokogiri/v1.18.3/lib/nokogiri/xml/document.rb:96-100`), whose `string_or_io.empty?` arm reaches Ruby's `Pathname#empty?` (`vendor/ruby/v3.3.11/ext/pathname/lib/pathname.rb`, `File.empty?` for a file). ruby-compat's `Pathname#isEmpty` is async (`packages/ruby-compat/lib/pathname.ts`), so `parse` reads its result only when it is `true`, receipted `@inventedArm === — CONVERGEABLE nokogiri-xml-document-parse-empty-pathname`; an empty file Pathname falls to `read_io` instead of the empty-document arm.

## Acceptance criteria

- [ ] An empty-file Pathname reaches `parse`'s empty-document arm, as Rails' does.
- [ ] The receipt is deleted.
