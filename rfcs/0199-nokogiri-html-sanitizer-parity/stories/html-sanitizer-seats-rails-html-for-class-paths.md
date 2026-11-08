---
title: "html-sanitizer-seats-rails-html-for-class-paths"
status: ready
updated: 2026-11-08
rfc: "0199-nokogiri-html-sanitizer-parity"
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

trails#9865 seats the gem ports for `parity:class-paths`, but leaves `crass`, `loofah` and `rails-html-sanitizer` in `SKIPPED` (`scripts/api-compare/class-paths.ts`). The walk of `packages/html-sanitizer/lib` reaches `sanitizer.ts::Sanitizer`, which pairs with both `Rails::HTML::Sanitizer` and `Rails::HTML5::Sanitizer` (`vendor/rails-html-sanitizer/v1.6.2/lib/rails/html/sanitizer.rb`), and neither is seated. Seating it means a `Trails::HTML` path. Reopening `TopLevel.Trails` from html-sanitizer (`TopLevel.Trails ??= { name: "Trails" }`) was tried and breaks activerecord: `connection-handling.ts` and `tasks/database-tasks.ts:795` read `TopLevel.Trails !== undefined` as "the app is booted" and then read `Trails.env`, so the trailties entry import throws. `FullSanitizer`, `LinkSanitizer` and `SafeListSanitizer` are each seated under both `HTML4` and `HTML5` (see `html-sanitizer-split-html4-html5-sanitizer-classes`).

## Acceptance criteria

- [ ] `Rails::HTML` is seated at its `Trails::HTML` path without a stub `Trails` that the activerecord boot checks misread. Either trailties reopens an existing seat, or those checks test for the application.
- [ ] `crass`, `loofah` and `rails-html-sanitizer` leave `SKIPPED`, html-sanitizer's `constants.generated.ts` is generated and imported, and `pnpm parity:class-paths:check` is green.
