---
title: "load-defaults-sanitizer-vendor-and-html5-probe"
status: ready
updated: 2026-09-25
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Configuration#loadDefaults` (`packages/trailties/src/application/configuration.ts`,
the `"7.1"` arm) still omits two assignments from
`vendor/rails/railties/lib/rails/application/configuration.rb`:

- `:276` `self.dom_testing_default_html_version = defined?(Nokogiri::HTML5) ? :html5 : :html4`
  — the port assigns `":html4"` unconditionally.
- `:313-321` `action_view.sanitizer_vendor = Rails::HTML::Sanitizer.best_supported_vendor`
  and the identical `action_text` line — both `respondTo` guards are ported
  with `/** @empty */` bodies.

Both hang off the `rails-html-sanitizer` gem (`Rails::HTML4::Sanitizer`,
`Rails::HTML5::Sanitizer`, `Rails::HTML::Sanitizer.best_supported_vendor` /
`html5_support?`), which trails has no counterpart for. actionview's
`SanitizeHelper` (`packages/actionview/src/helpers/sanitize-helper.ts`) holds a
single trails-internal `DefaultVendor` where Rails' `sanitize_helper.rb:12`
defaults `sanitizer_vendor` to `Rails::HTML4::Sanitizer`, and nothing reads
`config.actionView.sanitizerVendor`.

Split out of `converge-load-defaults-omitted-assignments` (RFC 0142), which
converged the other two omissions.

## Acceptance criteria

- trails has HTML4 and HTML5 sanitizer vendors and a `bestSupportedVendor`
  (with its HTML5-support probe), mirroring rails-html-sanitizer.
- The 7.1 arm assigns `actionView.sanitizerVendor` / `actionText.sanitizerVendor`
  from it, and `domTestingDefaultHtmlVersion` from the same HTML5 probe, as
  `configuration.rb:276,313-321` do.
- `action_view`'s railtie applies `config.action_view.sanitizer_vendor` to
  `SanitizeHelper.sanitizer_vendor`.
