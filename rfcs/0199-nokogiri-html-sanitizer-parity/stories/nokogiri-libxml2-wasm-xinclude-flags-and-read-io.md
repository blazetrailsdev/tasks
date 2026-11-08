---
title: "nokogiri-libxml2-wasm-xinclude-flags-and-read-io"
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

`packages/nokogiri/lib/xml/document.ts` `processXincludes` and `readIo` stand on libxml2-wasm 0.7.1, which exports neither `xmlXIncludeSetFlags`/`xmlXIncludeProcessTreeFlags` nor `xmlReadIO`. Nokogiri's ext passes `options.to_i` to `xmlXIncludeProcessTreeFlags` (`node.rb:530-536` → `process_xincludes`), so `NOXINCNODE`/`NOBASEFIX` are dropped; `read_io` (`document.rb:86`) reads the whole IO and goes through `readMemory`, dropping `url`/`encoding`.

## Acceptance criteria

- [ ] `processXincludes` passes its flags to libxml2 (upstream export or raw binding).
- [ ] `readIo` streams through `xmlReadIO` honouring `url` and `encoding`.
