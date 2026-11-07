---
title: "Retire the @blazetrails/actioncable/test-helpers specifier alias"
status: draft
updated: 2026-11-07
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9839 moved actioncable's `src/test-helpers/` to `test/support/`. It kept the import specifier `@blazetrails/actioncable/test-helpers/*` as a bridge to the new directory:

- `vitest.config.ts`: an alias for `@blazetrails/actioncable/test-helpers/` that points at `packages/actioncable/test/support/`
- `packages/solid-cable/tsconfig.test.json` and `packages/trailties/tsconfig.test.json`: `paths` entries for the same specifier

The specifier no longer names a real directory. Its consumers:

- `packages/solid-cable/test/action-cable/subscription-adapter/solid-cable.test.ts:4` (`subscription-adapter/common`)
- `packages/trailties/src/boot-app-test-help.trails.test.ts:8` (`stubs/test-server`)

## Acceptance criteria

- [ ] Both consumers import a specifier that matches the real directory, `@blazetrails/actioncable/test/support/...`. Alternatively they import by relative path, if RFC 0223 settles a cross-package test-support convention.
- [ ] The `test-helpers/` alias is gone from vitest.config.ts and both tsconfig.test.json files.
- [ ] The solid-cable and trailties tests still pass.
