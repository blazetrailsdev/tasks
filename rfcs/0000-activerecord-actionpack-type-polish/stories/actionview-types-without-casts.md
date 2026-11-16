---
title: "actionview lib without double casts"
status: draft
updated: 2026-11-16
rfc: "0000-activerecord-actionpack-type-polish"
cluster: type-polish-neighbours
packages: [actionview]
deps: [type-polish-count-double-casts]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

actionview `lib/` has 51 `as unknown as` and no `any`. `test-case.ts` holds
15 (casts onto `BehaviorClass`, 6), `helpers/sanitize-helper.ts` 6
(`SanitizeHelperClass`, 6), and `lookup-context.ts`, `layouts.ts`
(`LayoutsClass`), `form-helper.ts` and `form-tag-helper.ts` 3–4 each.
`SanitizeHelper` is a class module (CLAUDE.md § "A Ruby module is a JS object
or a JS class"), so its statics can be typed through the class itself.

## Acceptance criteria

- [ ] actionview `lib/` `as unknown as` ≤ 15.
- [ ] `SanitizeHelperClass` / `BehaviorClass` / `LayoutsClass` casts are
      replaced by the class-module's own static type or a `this`-typed host.
- [ ] Each remaining cast is listed in the PR body with its reason.
