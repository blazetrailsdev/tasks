---
title: "html-sanitizer-split-html4-html5-sanitizer-classes"
status: in-progress
updated: 2026-11-09
rfc: "0199-nokogiri-html-sanitizer-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9894
claim: "2026-11-08T22:50:32Z"
assignee: "html-sanitizer-split-html4-html5-sanitizer-classes"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:class-paths:check` walks `packages/html-sanitizer/lib` and finds `FullSanitizer`, `LinkSanitizer`, `SafeListSanitizer` (`full-sanitizer.ts`, `link-sanitizer.ts`, `safe-list-sanitizer.ts`) and `Sanitizer` (`sanitizer.ts`) with no single Ruby counterpart. Rails defines separate `Rails::HTML4::FullSanitizer` and `Rails::HTML5::FullSanitizer` (etc.) in `vendor/rails-html-sanitizer/v1.6.2/lib/rails/html/sanitizer.rb`; trails seats one class under both `HTML4` and `HTML5` (`lib/html4.ts`, `lib/html5.ts`), so no class-path table can name it. Each carries `@noRailsEquivalent CONVERGEABLE html-sanitizer-split-html4-html5-sanitizer-classes`.

## Acceptance criteria

- [ ] `HTML4` and `HTML5` each have their own `FullSanitizer`, `LinkSanitizer` and `SafeListSanitizer` classes, and `Rails::HTML::Sanitizer` is paired, as `sanitizer.rb` defines them.
- [ ] Each pairs in `parity:class-paths`, and the receipts are deleted.
