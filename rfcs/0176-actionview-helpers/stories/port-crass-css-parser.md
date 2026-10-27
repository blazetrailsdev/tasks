---
title: "port-crass-css-parser"
status: draft
updated: 2026-10-27
rfc: "0176-actionview-helpers"
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

`Loofah::HTML5::Scrub.scrub_css` (`vendor/loofah/v2.24.0/lib/loofah/html5/scrub.rb:72-121`)
and `scrub_attribute_that_allows_local_ref` (`:123-140`) are built on Crass
(`Crass.parse_properties`, `Crass::Parser.new(...).parse_component_values`,
`Crass::Parser.stringify`). trails has no Crass port (source vendored at
`vendor/crass/`), which blocks `html-sanitizer-safe-list-sanitize-css` and
`html-sanitizer-port-scrubbers`.

## Acceptance criteria

- `Crass::Tokenizer` and `Crass::Parser` ported (into html-sanitizer or a new
  `packages/crass`), with `parse_properties`, `parse_component_values` and
  `stringify` at their Rails/Crass names.
- Crass's own tests for those entry points ported.
