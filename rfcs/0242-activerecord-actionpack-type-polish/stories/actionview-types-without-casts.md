---
title: "actionview lib without double casts"
status: ready
updated: 2026-11-18
rfc: "0242-activerecord-actionpack-type-polish"
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

## Verification

Count hits from `packages/actionview/lib`, before and after, and record both in
the PR body:

```sh
grep -Po ': any|as any|as unknown as' -r --include=*.ts . | wc -l
```

This is the RFC's Motivation command, which counts matches, not lines.
`pnpm typecheck`, `pnpm parity:lint:counts`, `pnpm test:types`,
`pnpm parity:api` and `pnpm parity:test` are green, with non-negative parity
deltas.

## Definition of done

Renaming a Rails method, parameter or local, reordering control flow, or
adding a wrapper to avoid a cast does not close this story.
