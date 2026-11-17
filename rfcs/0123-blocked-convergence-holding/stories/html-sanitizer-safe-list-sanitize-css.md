---
title: "html-sanitizer-safe-list-sanitize-css"
status: ready
updated: 2026-11-17
rfc: "0123-blocked-convergence-holding"
cluster: null
packages:
  - "html-sanitizer"
  - "actionview"
deps:
  - port-loofah-scrubber-and-html5-scrub
  - port-crass-css-parser
  - vendor-rails-html-sanitizer-loofah-and-crass
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionView::Helpers::SanitizeHelper#sanitize_css`
(`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/sanitize_helper.rb:122-124`) calls
`self.class.safe_list_sanitizer.sanitize_css(style)`. rails-html-sanitizer's
`SafeListSanitizer#sanitize_css` (`Loofah::HTML5::Scrub.scrub_css`) has no trails port.
`SafeListSanitizer` in `packages/html-sanitizer/lib/sanitizer.ts` defines only `sanitize`.
As a result, `sanitizeCss` in `packages/actionview/lib/helpers/sanitize-helper.ts:47-48`
calls `safeListSanitizer.sanitizeCss!` and raises a `TypeError` under the default vendor,
and the `Sanitizer` type (`:8`) keeps `sanitizeCss` optional.

Unblocked 2026-11-17: crass (trails#9395), the Loofah scrubber (trails#9420) and the
vendored gems are all done. Loofah's `scrubCss` is now in
`packages/html-sanitizer/lib/loofah/html5/scrub.ts:88`, so most of what remains is wiring.

## Acceptance criteria

- `SafeListSanitizer#sanitizeCss` exists in html-sanitizer, following Loofah's `scrub_css`.
- The `Sanitizer` type's `sanitizeCss` is required for the safe-list sanitizer and
  `sanitize-helper.ts` drops its `!`.
- The "sanitize css" test, parked under `// BLOCKED: html-sanitizer-safe-list-sanitize-css`
  in `packages/actionview/test/template/sanitize-helper.test.ts`, is un-skipped and passes.
