---
title: "XML::Document wrap forwards init args and runs initialize"
status: ready
updated: 2026-11-26
rfc: "0199-nokogiri-html-sanitizer-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Nokogiri::XML::Document.new(version = "1.0", *rest)` (`vendor/nokogiri/v1.19.7/ext/nokogiri/xml_document.c` `new`) forwards `argc, argv` to `noko_xml_document_wrap_with_init_args` (`:703-721`), which allocates, seats the pointer and `@decorators` / `@errors`, then `rb_obj_call_init(rb_document, argc, argv)`. trails (`packages/nokogiri/lib/xml/document.ts`) takes only `version`, and the module-private `nokoXmlDocumentWrap` seats fields by hand on `Object.create(klass.prototype)` (trails#10821), repeating the class field initializers, so a field added later is missing on parsed documents.

## Acceptance criteria

- `XmlDocument`'s constructor accepts `...rest` after `version` and passes it on as Ruby's `initialize` arguments.
- `nokoXmlDocumentWrap` takes `argc/argv` (`...args`) like `noko_xml_document_wrap_with_init_args`, seats only what the C seats, and runs the `initialize` part (`lib/nokogiri/xml/document.rb` `initialize`) instead of copying field defaults by hand.
