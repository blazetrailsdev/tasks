---
title: "html-sanitizer-port-scrubbers"
status: draft
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
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

`packages/html-sanitizer` has no port of rails-html-sanitizer 1.6.2's
scrubbers (`lib/rails/html/scrubbers.rb`: `Rails::HTML::PermitScrubber`,
`TargetScrubber`, `TextOnlyScrubber`). Its `SafeListSanitizer` / `LinkSanitizer`
/ `FullSanitizer` go through sanitize-html configurations in `src/engine.ts`
instead, which is why `sanitize(html, scrubber:)` is unsupported and
`test_html_scrubber_class_names` (`test/rails_api_test.rb:13-18`) and the
gem's `test/scrubbers_test.rb` are unported. Surfaced on trails#8263, which
ported the rest of `RailsApiTest` into
`packages/html-sanitizer/src/rails-api.test.ts`.

## Acceptance criteria

- `HTML.PermitScrubber`, `HTML.TargetScrubber`, `HTML.TextOnlyScrubber` exist
  and mirror `scrubbers.rb` (names, `scrub` / `scrub_node` / `keep_node?` /
  `allowed_node?` control flow).
- `SafeListSanitizer#sanitize` honors a `scrubber:` option as
  `Concern::Scrubber::SafeList#scrub` (`sanitizer.rb:156-167`) does.
- `html_scrubber_class_names` is ported into `rails-api.test.ts`, and the
  `scrubbers_test.rb` cases into a `scrubbers.test.ts`.
