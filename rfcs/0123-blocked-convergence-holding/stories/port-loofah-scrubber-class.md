---
title: "port-loofah-scrubber-class"
status: draft
updated: 2026-10-28
rfc: "0123-blocked-convergence-holding"
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

`port-loofah-scrubber-and-html5-scrub` shipped `Loofah::HTML5::SafeList`,
`Loofah::HTML5::Scrub`, `MetaHelpers` and `LibxmlWorkarounds` under
`packages/html-sanitizer/src/loofah/`, plus the nokogiri HTML5 mutation surface
Scrub needs (`Attr#remove`, `Attr#value=`, `Attr#namespace`, `Node#before`,
`Node#remove`, `Node#attributes`, `Node#remove_attribute`,
`Document#create_cdata`). `Loofah::Scrubber`
(`vendor/loofah/v2.24.0/lib/loofah/scrubber.rb`) was split out to hold the
LOC ceiling.

A complete draft port (scrubber.ts + scrubber.trails.test.ts, ~170 LOC) was
written and passed: `CONTINUE`/`STOP` as frozen objects, constructor
`(options = {}, block = null)` with the block moved across when passed alone,
`ArgumentError "direction #{direction} must be one of :top_down or :bottom_up"`,
`ScrubberNotFound < RuntimeError`, `traverse`, `scrub`, `append_attribute`
(needs nokogiri `Node#[]=` / `get_attribute` / `set_attribute`), private
`html5lib_sanitize` (needs `Nokogiri::XML::Node::ELEMENT_NODE` etc. as a value
export of the html5 `Node` from `@blazetrails/nokogiri`), and
`traverse_conditionally_top_down` / `_bottom_up`.

## Acceptance criteria

- `Loofah::Scrubber` and `ScrubberNotFound` ported at
  `packages/html-sanitizer/src/loofah/scrubber.ts` at Loofah's names.
- nokogiri html5 `Node` gains `set` / `getAttribute` / `setAttribute`, and the
  `Node` class (with its `*_NODE` constants) is reachable as a value.
- Tests: top-down CONTINUE/STOP node counts from
  `vendor/loofah/v2.24.0/test/unit/test_scrubber.rb`, bottom-up order,
  invalid direction, ScrubberNotFound, append_attribute, html5lib_sanitize.
