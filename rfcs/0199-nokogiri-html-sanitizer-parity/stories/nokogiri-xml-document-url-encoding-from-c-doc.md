---
title: "nokogiri-xml-document-url-encoding-from-c-doc"
status: draft
updated: 2026-11-27
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

`XmlDocument` (`packages/nokogiri/lib/xml/document.ts`) carries `url` and `encoding` as class field initializers. Ruby reads both from the C document (`vendor/nokogiri/v1.19.7/ext/nokogiri/xml_document.c` `url` → `doc->URL`, `encoding` → `doc->encoding`, `encoding=` writes `doc->encoding` with `xmlStrdup`). libxml2-wasm 0.7.1 exports no `xmlDoc` struct accessor, no heap view and no `xmlStrdup`/`xmlFree`, so neither the read nor the write can reach the C document. Split from nokogiri-xml-document-decorators-url-encoding, which shipped `decorators` / `decorate`.

## Acceptance criteria

- [ ] `url` and `encoding` read `doc->URL` / `doc->encoding`, and `encoding=` writes `doc->encoding`, through a binding seated in `lib/extension.ts`; the JS fields are deleted.
