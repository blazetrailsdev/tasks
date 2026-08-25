---
title: "extra-surface: abstractcontroller base.ts callbacks + apply* installer pattern"
status: done
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: extra-surface
deps: ["extra-surface-reasoned-allowlist"]
deps-rfc: []
est-loc: 250
priority: null
pr: 5332
claim: "2026-07-25T23:34:53Z"
assignee: "extra-surface-abstractcontroller-apply-mixin-pattern"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra` for abstractcontroller shows a recurring pattern: `applyX`
mixin-installer functions with no Rails counterpart, plus a callback-macro
cluster on `base.ts`:

- `base.ts` — 7 novel: `afterAction`, `aroundAction`, `beforeAction`,
  `skipAfterAction`, `skipAroundAction`, `skipBeforeAction`, `hasAction`.
  In Rails the `*_action` macros live in
  `vendor/rails/actionpack/lib/abstract_controller/callbacks.rb` (defined
  metaprogrammatically via `define_method` inside `included`) — check whether
  these are misplaced (belong in `callbacks.ts`) and whether the Ruby
  extractor records the metaprogrammed names at all (if not, this is also an
  extractor blind spot worth noting on close).
- Installer pattern — `applyCaching`/`setCacheStore` (`caching.ts`),
  `applyHelpers`/`defaultHelperModule` (`helpers.ts`), `applyFragments`
  (`caching/fragments.ts`), `applyAssetPaths` (`asset-paths.ts`),
  `applyLogger` (`logger.ts`), `applyCallbacks`-style `conditionalKey`
  (`callbacks.ts`), `normalizeRender` (`rendering.ts`),
  `filterActionMethodsForRoutes` (`url-for.ts`),
  `trailtieRoutesUrlHelpers`/`withRoutesHelpers`
  (`trailties/routes-helpers.ts`). These are the TS analogue of Ruby's
  `included do` hooks (no TS equivalent per CLAUDE.md "When NOT to use
  this") — most are legitimate and belong in the reasoned allowlist with
  that rationale, unless a cheaper `include()`/`Included<>` route
  (activesupport `include.ts`) removes the need.

Paths: `packages/actionpack/src/abstract-controller/…`.

## Acceptance criteria

- The `base.ts` action-callback cluster is relocated/reconciled against
  `abstract_controller/callbacks.rb` (moved to the Rails-layout file, or
  allowlisted with the metaprogramming rationale).
- Every `apply*` installer is either replaced by the standard
  `include()`/`Included<>` mechanism or allowlisted with the `included do`
  rationale via extra-surface-reasoned-allowlist.
- `pnpm parity:api:extra --package abstractcontroller` reports 0 unreconciled novel
  entries; touched test files pass.
