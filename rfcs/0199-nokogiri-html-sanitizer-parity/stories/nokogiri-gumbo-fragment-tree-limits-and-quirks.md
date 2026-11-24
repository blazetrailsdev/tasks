---
title: "nokogiri-gumbo-fragment-tree-limits-and-quirks"
status: draft
updated: 2026-11-24
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

`Gumbo.fragment` (`packages/nokogiri/lib/gumbo.ts`) ports `noko_gumbo_s_fragment` (`vendor/nokogiri/v1.18.3/ext/nokogiri/gumbo.c:434-590`) over parse5. It honours `max_errors` (through `onParseError`) and `parse_noscript_content_as_text`, but parse5 has no `max_tree_depth` or `max_attributes` limit (Gumbo raises `ArgumentError` past them, `gumbo.c` `parse_cleanup`), does not report tree-construction errors (so `test/html5/test_errors.rb` is unportable), and computes no `@quirks_mode` or form-ancestor context (`gumbo.c:494-555`).

## Acceptance criteria

- [ ] `max_tree_depth` and `max_attributes` are enforced as Gumbo enforces them.
- [ ] `quirks_mode` is set on the fragment, and a form ancestor is reflected in the fragment parse.
