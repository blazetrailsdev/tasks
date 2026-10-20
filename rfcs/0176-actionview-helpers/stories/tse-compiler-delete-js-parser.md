---
title: "Delete tse-compiler's js-parser (no second compiler for Template#spot)"
status: draft
updated: 2026-10-20
rfc: "0176-actionview-helpers"
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

Repo-owner ruling (2026-10-19): trails builds no second compiler. `packages/tse-compiler/src/js-parser.ts` (`parseScript`, `JsNode`, `JsParseError`, about 800 LOC, exported from `src/index.ts:12`) stood in for `Prism.parse(compiled_source)` in `Template#spot` (`vendor/rails/v8.0.2/actionview/lib/action_view/template.rb:231-246`). Nothing outside tse-compiler uses it. `Template#spot` (`packages/actionview/src/template.ts:224`) is line-based and already carries `@missingRailsCall parse — PERMANENT`.

## Acceptance criteria

- Delete `js-parser.ts`, `js-parser.test.ts`, and the exports.
- Ratify the line-based `spot` in the CLAUDE.md "Templates are precompiled" section, which needs no in-process JS parser.
- Close `template-spot-spans-the-failing-node` as `PERMANENT:`, citing that section.
