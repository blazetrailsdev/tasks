---
title: "html-sanitizer-port-scrubbers"
status: blocked
updated: 2026-10-27
rfc: "0123-blocked-convergence-holding"
cluster: null
packages:
  - "html-sanitizer"
  - "actionview"
deps:
  - port-loofah-scrubber-and-html5-scrub
  - vendor-rails-html-sanitizer-loofah-and-crass
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: "needs port-loofah-scrubber-and-html5-scrub"
closed-reason: null
---

## Context

`packages/html-sanitizer` has no port of rails-html-sanitizer 1.6.2's
scrubbers (`vendor/rails-html-sanitizer/v1.6.2/lib/rails/html/scrubbers.rb`: `Rails::HTML::PermitScrubber`,
`TargetScrubber`, `TextOnlyScrubber`). Its `SafeListSanitizer` / `LinkSanitizer`
/ `FullSanitizer` go through sanitize-html configurations in `lib/engine.ts`
instead, which is why `sanitize(html, scrubber:)` is unsupported and
`test_html_scrubber_class_names` (`vendor/rails-html-sanitizer/v1.6.2/test/rails_api_test.rb:13-18`) and the
gem's `vendor/rails-html-sanitizer/v1.6.2/test/scrubbers_test.rb` are unported. Surfaced on trails#8263, which
ported the rest of `RailsApiTest` into
`packages/html-sanitizer/test/rails-api.test.ts`.

## Acceptance criteria

- `HTML.PermitScrubber`, `HTML.TargetScrubber`, `HTML.TextOnlyScrubber` exist
  and mirror `scrubbers.rb` (names, `scrub` / `scrub_node` / `keep_node?` /
  `allowed_node?` control flow).
- `SafeListSanitizer#sanitize` honors a `scrubber:` option as
  `Concern::Scrubber::SafeList#scrub` (`vendor/rails-html-sanitizer/v1.6.2/lib/rails/html/sanitizer.rb:156-167`) does.
- `html_scrubber_class_names` is ported into `rails-api.test.ts`, and the
  `scrubbers_test.rb` cases into a `scrubbers.test.ts`.
- The actionview tests parked under `// BLOCKED: html-sanitizer-port-scrubbers`
  in `packages/actionview/test/template/sanitize-helper.test.ts` are
  un-skipped and pass. There are three: "sanitize with loofah scrubber
  option", "sanitize with custom scrubber option", and "we get the expected
  HTML parser".

## Notes

Unblocked 2026-11-17: `port-loofah-scrubber-and-html5-scrub` is done
(trails#9420). The Loofah scrubber the Rails scrubbers subclass now exists
under `packages/html-sanitizer/lib/loofah/`. The sanitizers in
`lib/sanitizer.ts` still go through `lib/engine.ts`. This story is one of
the last items keeping actionview's test parity below 100%.
