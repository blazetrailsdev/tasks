---
title: "html-sanitizer-seat-trails-namespace"
status: closed
updated: 2026-11-09
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
closed-reason: "FALSIFIED: trails#9889 already seats Rails::HTML at Trails::HTML; parity:class-paths:check is green on trails#9894"
---

## Context

`html-sanitizer-split-html4-html5-sanitizer-classes` split the sanitizer classes into `packages/html-sanitizer/lib/sanitizer.ts` (`HTML4FullSanitizer` … `HTML5SafeListSanitizer`, `Sanitizer`), and `parity:class-paths` now pairs them as `Trails::HTML::Sanitizer`, `Trails::HTML4::FullSanitizer`, etc. But `pnpm parity:class-paths:check` still reds, because `checkSeatedPaths` (`scripts/api-compare/class-paths.ts`) runs `constGet(Object, path)` on each row, and that raises `NameError: uninitialized constant Trails`. Nothing seats `TopLevel.Trails` when only html-sanitizer is loaded.

In Ruby, rails-html-sanitizer opens `module Rails` itself (`vendor/rails-html-sanitizer/v1.6.2/lib/rails/html/sanitizer.rb:3`, `:416-422`). In trails, only trailties seats it (`packages/trailties/src/trails.ts:194`, `constSet(TopLevel, "Trails", Trails)`), and activerecord reads an unset `TopLevel.Trails` as `defined?(Rails)` being false (`packages/activerecord/src/tasks/database-tasks.ts:795`).

## Acceptance criteria

- [ ] With html-sanitizer's entry loaded, `constGet(Object, "Trails::HTML4::FullSanitizer")` (and every other html-sanitizer row) resolves, and `pnpm parity:class-paths:check` is green.
- [ ] Loading trailties after html-sanitizer keeps both trailties' `Trails` members and `Trails.HTML` / `HTML4` / `HTML5`. This is Ruby's reopening of `module Rails`.
- [ ] Callers that test `TopLevel.Trails === undefined` as `defined?(Rails)` are checked, and each one either still holds or is converged.
