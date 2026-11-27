---
title: "nokogiri-xml-document-decorators-url-encoding"
status: in-progress
updated: 2026-11-27
rfc: "0199-nokogiri-html-sanitizer-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10845
claim: "2026-11-27T16:44:51Z"
assignee: "nokogiri-xml-builder"
blocked-by: null
closed-reason: null
---

## Context

`XML::Document#initialize` (`vendor/nokogiri/v1.19.7/lib/nokogiri/xml/document.rb:191-195`) sets `@errors`, `@decorators` and `@namespace_inheritance`. trails' `XmlDocument` (`packages/nokogiri/lib/xml/document.ts`) has no `decorators` (`document.rb` `decorators(key)`, `decorate`, `@decorators`). It also carries `url` and `encoding` as class field initializers, although Ruby reads both from the C document (`ext/nokogiri/xml_document.c` `url`, `encoding`, `encoding=`). Surfaced in review of trails#10827.

## Acceptance criteria

- [ ] `decorators` / `decorate` are ported at their `document.rb` names, seated from `initialize`'s `@decorators = nil`.
- [ ] `url` and `encoding` read the libxml2 document (`doc->URL`, `doc->encoding`) instead of JS fields, and `encoding=` writes it.
