---
title: "Port Loofah::Scrubber, HTML5::SafeList and HTML5::Scrub over @blazetrails/nokogiri"
status: claimed
updated: 2026-10-28
rfc: "0176-actionview-helpers"
cluster: null
packages: ["html-sanitizer"]
deps:
  - port-crass-css-parser
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: "2026-10-28T16:26:59Z"
assignee: "crass-parse-properties-at-rule-tests"
blocked-by: null
closed-reason: null
---

## Context

rails-html-sanitizer's `PermitScrubber` / `TargetScrubber` / `TextOnlyScrubber`
(`vendor/rails-html-sanitizer/v1.6.2/lib/rails/html/scrubbers.rb`) subclass
`Loofah::Scrubber` (`vendor/loofah/v2.24.0/lib/loofah/scrubber.rb`) and call
`Loofah::HTML5::Scrub` (`html5/scrub.rb`: `allowed_element?`,
`scrub_attributes`, `scrub_css`, `scrub_uri_attribute`, `cdata_needs_escaping?`,
`cdata_escape`, `force_correct_attribute_escaping!`) and `Loofah::HTML5::SafeList`
(`html5/safelist.rb`). None is ported; `packages/html-sanitizer/src/engine.ts`
goes through sanitize-html instead. Blocks `html-sanitizer-port-scrubbers` and
`html-sanitizer-safe-list-sanitize-css`.

## Acceptance criteria

- `Loofah::Scrubber` (CONTINUE/STOP, top_down/bottom_up traverse),
  `Loofah::HTML5::SafeList` constants and `Loofah::HTML5::Scrub` ported over
  `@blazetrails/nokogiri` nodes, at Loofah's names.
- `scrub_css` depends on the Crass port (`port-crass-css-parser`).
