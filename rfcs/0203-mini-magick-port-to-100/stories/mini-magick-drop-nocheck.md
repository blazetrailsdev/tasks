---
title: "Drop noCheck from mini-magick's tsconfig once it type-checks clean"
status: blocked
updated: 2026-10-27
rfc: "0203-mini-magick-port-to-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: "2026-10-27T17:18:37Z"
assignee: "ruby-compat-move-time-from-date"
blocked-by: "waiting on mini-magick-typecheck-clean: tsc -p packages/mini-magick still reports 369 errors"
closed-reason: null
---

## Context

trails#9262 joined `packages/mini-magick` to the root `tsconfig.json` build with `"noCheck": true` in `packages/mini-magick/tsconfig.json`, because `tsc -p packages/mini-magick` reported 462 errors. With `noCheck`, `pnpm build` and `pnpm typecheck` emit the package without type-checking it, so a type error introduced by any later mini-magick story is invisible to CI.

## Acceptance criteria

- `"noCheck": true` is removed from `packages/mini-magick/tsconfig.json`, and `pnpm build` / `pnpm typecheck` are green with mini-magick type-checked like every other package.
- Lands with or right after `mini-magick-typecheck-clean`, which brings the error count to 0.
