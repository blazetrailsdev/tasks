---
title: "html-sanitizer: port Rails::HTML5::Sanitizer vendors now that Nokogiri::HTML5 is defined"
status: draft
updated: 2026-10-15
rfc: "0176-actionview-helpers"
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

trails#8933 added `HTML5.DocumentFragment` to `@blazetrails/nokogiri`, built on parse5. That makes `"HTML5" in Nokogiri` true, so `Rails::HTML::Sanitizer.html5_support?` (`packages/html-sanitizer/src/sanitizer.ts:10`) now returns true. Two things follow:

- `best_supported_vendor` returns `HTML5.Sanitizer`. `packages/html-sanitizer/src/namespaces.ts:19` declares `HTML5 = {}` and nothing populates it, so the vendor is `undefined`.
- `load_defaults "7.1"` (`packages/trailties/src/application/configuration.ts:370-375`, Rails `railties/lib/rails/application/configuration.rb:315-317`) seats that `undefined` vendor as `action_view.sanitizer_vendor` / `action_text.sanitizer_vendor`.

Rails' rails-html-sanitizer defines `Rails::HTML5::Sanitizer` with `FullSanitizer`, `LinkSanitizer` and `SafeListSanitizer` (`lib/rails/html/sanitizer.rb`, the `HTML5` module), each parsing with `Loofah::HTML5::DocumentFragment`.

## Acceptance criteria

- `HTML5.Sanitizer`, `HTML5.FullSanitizer`, `HTML5.LinkSanitizer` and `HTML5.SafeListSanitizer` are ported in `packages/html-sanitizer`, parsing through `HTML5.DocumentFragment`.
- `bestSupportedVendor()` returns a populated vendor.
- The trailties test "sanitizer_vendor is set to best supported vendor in new apps" is un-skipped and passes.
