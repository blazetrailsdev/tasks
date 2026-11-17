---
title: "Loofah::HTML5::DocumentFragment carries scrub!/to_text; sanitizers call fragment.scrub!"
status: draft
updated: 2026-11-17
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10264 ported Loofah's `ScrubBehavior` (`vendor/loofah/v2.24.0/lib/loofah/concerns.rb:32-67`)
as free functions taking the receiver first: `ScrubBehavior.Node.scrubBang(self, scrubber)` and
`ScrubBehavior.NodeSet.scrubBang(self, scrubber)` in `packages/html-sanitizer/lib/loofah/concerns.ts`.
`Loofah.html4Fragment` / `html5Fragment` (`packages/html-sanitizer/lib/loofah.ts`) return a plain
Nokogiri `HTML5.DocumentFragment`.

In Loofah, `html5_fragment` returns `Loofah::HTML5::DocumentFragment`
(`vendor/loofah/v2.24.0/lib/loofah/html5/document_fragment.rb`), which includes `TextBehavior`,
`HtmlFragmentBehavior` and `ScrubBehavior::Node` (decorating Nokogiri nodes and node sets). So a Rails
body writes `fragment.scrub!(scrubber)` and `fragment.to_text`. The sanitizer bodies in
`packages/html-sanitizer/lib/sanitizer.ts` (`scrub`, from `rails/html/sanitizer.rb:58-167`) therefore
call `ScrubBehavior.Node.scrubBang(fragment, …)`, not `fragment.scrubBang(…)`.

## Acceptance criteria

- `Loofah::HTML5::DocumentFragment` (and `Loofah::HTML5::Document`) are ported as subclasses of the
  Nokogiri HTML5 classes, including `ScrubBehavior::Node#scrub!` as `scrubBang` and `TextBehavior`
  (`concerns.rb:69-140`: `text`, `to_text`).
- `Loofah.html5Fragment` / `scrubHtml5Fragment` return the Loofah subclass, as `loofah.rb:108-120` does.
- `sanitizer.ts`'s `scrub` bodies and `ScrubBehavior.NodeSet` call `fragment.scrubBang(scrubber)` /
  `node.scrubBang(scrubber)` directly, matching `sanitizer.rb:58-167` and `concerns.rb:43,53`.
- The fragment/text cases from `vendor/loofah/v2.24.0/test/` (html5 fragment and text tests) are
  ported with verbatim names.
