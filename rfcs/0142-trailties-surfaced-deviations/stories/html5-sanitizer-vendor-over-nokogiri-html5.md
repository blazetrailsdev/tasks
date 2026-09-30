---
title: "html5-sanitizer-vendor-over-nokogiri-html5"
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

`load-defaults-sanitizer-vendor-and-html5-probe` ported
`Rails::HTML::Sanitizer.html5_support?` / `best_supported_vendor`
(rails-html-sanitizer-1.6.2 `lib/rails/html/sanitizer.rb:7-15`) and
`Rails::HTML4::Sanitizer`'s `VendorMethods` (`:194-304`) into
`packages/html-sanitizer/src/{sanitizer,html4,namespaces}.ts`, and
`Configuration#loadDefaults("7.1")` now reads
`defined?(Nokogiri::HTML5)` (`vendor/rails/v8.0.2/railties/lib/rails/application/configuration.rb:276`)
as `"HTML5" in Nokogiri`.

Both probes answer false: `@blazetrails/nokogiri` (`packages/nokogiri/src/index.ts`)
exports only `XML` and `SAX`, no `HTML5`. So `Rails::HTML5`
(`sanitizer.rb:306-414`, defined only `if Rails::HTML::Sanitizer.html5_support?`)
is unported, `HTML5` in `namespaces.ts` is never seated, and the
`test_best_supported_vendor_when_html5_is_supported_returns_html5` /
`test_html5_*_sanitizer` ports skip exactly as they do on JRuby
(`test/rails_api_test.rb:26-32,69-85`).

Loofah's probe is `Nokogiri::VERSION > 1.14.0 && Nokogiri.uses_gumbo?`
(loofah-2.24.0 `lib/loofah.rb:7-15`).

## Acceptance criteria

- `@blazetrails/nokogiri` exports an `HTML5` namespace (`Nokogiri::HTML5`,
  `HTML5::DocumentFragment` at minimum) backed by a spec-compliant HTML5 parser
  wrapped from npm (parse5 is already in the lockfile via jsdom; declare it
  properly).
- `packages/html-sanitizer` ports `Rails::HTML5::Sanitizer` and the HTML5
  `FullSanitizer` / `LinkSanitizer` / `SafeListSanitizer`
  (`sanitizer.rb:306-414`), seated on `HTML5` when `isHtml5Support()`.
- The skipped `RailsApiTest` html5 tests in
  `packages/html-sanitizer/src/rails-api.test.ts` run and pass, and
  `dom testing uses the HTML5 parser in new apps if it is supported` sees `:html5`.
