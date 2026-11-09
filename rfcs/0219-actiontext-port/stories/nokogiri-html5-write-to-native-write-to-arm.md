---
title: "Nokogiri HTML5 Node#write_to AS_XML arm calls native_write_to with encoding and indent"
status: done
updated: 2026-11-09
rfc: "0219-actiontext-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#9927
claim: "2026-11-09T19:35:25Z"
assignee: "command-behavior-lookup-scans-load-path"
blocked-by: null
closed-reason: null
---

## Context

`Nokogiri::HTML5::Node#write_to` (`vendor/nokogiri/v1.18.3/lib/nokogiri/html5/node.rb:39-69`) reads `encoding` and `indent_text`/`indent` from the options. On the AS_XML / AS_XHTML arm it calls `native_write_to(io, encoding, indent_string, config_options)` (`:61`). The C side is `native_write_to` in `ext/nokogiri/xml_node.c`.

trails (`packages/nokogiri/lib/html5/node.ts`, `writeTo`, landed in trails#9893) skips reading `encoding` and the indent options. On that arm it writes `this.toString()`, so the encoding, the indent and the save flags never reach the output.

## Acceptance criteria

- Port `XML::Node#native_write_to` (or the closest parse5/XML-serializer equivalent) under its Rails name, and have `writeTo` read `encoding`, `indent_text` and `indent` exactly as `node.rb:42-60` does.
- The AS_XML arm calls `nativeWriteTo(io, encoding, indentString, configOptions)`. The save options must be honoured (FORMAT, NO_DECLARATION, NO_EMPTY_TAGS).
- Port the nokogiri tests covering `write_to` with `save_with: AS_XML` on an HTML5 node.
