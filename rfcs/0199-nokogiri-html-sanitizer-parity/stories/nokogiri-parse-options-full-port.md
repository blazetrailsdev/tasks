---
title: "nokogiri-parse-options-full-port"
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

`packages/nokogiri/lib/xml/parse-options.ts` ports `Nokogiri::XML::ParseOptions` (`vendor/nokogiri/v1.18.3/lib/nokogiri/xml/parse_options.rb`) with only `STRICT`, `RECOVER`, `NONET`, `BIG_LINES`, `DEFAULT_XML`, `initialize`, `strict?` and `to_i`. Rails defines the full flag set (`NOENT` … `NOXINCNODE`, `DEFAULT_HTML`, `DEFAULT_XSLT`, `DEFAULT_SCHEMA`), a flag/`no<flag>`/`<flag>?` triple per constant, `strict`, `==`, and `inspect`. `XmlDocument.parse` (`xml/document.rb:56-92`) also lacks the block yield, `url` from `path`, `read_io`, the Pathname arm, `encoding` on the empty document, and `do_xinclude`.

## Acceptance criteria

- [ ] `ParseOptions` carries every constant and generated method in parse_options.rb.
- [ ] `XmlDocument.parse` yields the options to a block and ports the `url`, encoding and `do_xinclude` arms.
