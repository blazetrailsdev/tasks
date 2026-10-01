---
title: "trails-tsc: type addFlashTypes custom flash readers in views"
status: done
updated: 2026-10-01
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: 1
pr: trails#8315
claim: "2026-09-30T21:11:51Z"
assignee: "action-controller-render-is-untyped"
blocked-by: null
closed-reason: null
---

## Context

`templateScope` (`packages/trails-tsc/src/build-views.ts`, PR #8296) types only the default flash helpers, as `Record<"alert" | "notice", unknown>` (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/flash.rb:13`). `add_flash_types` defines one reader per custom type and registers it with `helper_method` (`flash.rb:34-44`), so `add_flash_types :warning` makes `warning` available in views. trails ports it as `addFlashTypes` (`packages/actionpack/src/action-controller/metal/flash.ts:45`). A custom type used in a view resolves to the non-strict `any` fallback.

## Converged shape

`bindCheckedTypes` collects string-literal arguments of `addFlashTypes(...)` along the same class-level controller chain `exposedHelperMethods` walks. Each type is added to the view as `<type>: unknown` (the same type as `alert` / `notice`), and to layouts through the same merge.

## Acceptance criteria

- [ ] A controller with `static { this.addFlashTypes("warning") }` types `warning` in its views and layout.
- [ ] Test in `packages/trails-tsc/src/build-views.test.ts`.
