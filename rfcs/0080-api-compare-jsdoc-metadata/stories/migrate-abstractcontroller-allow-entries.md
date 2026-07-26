---
title: "Migrate abstractcontroller extra-surface allow entries to inline tags"
status: draft
updated: 2026-07-26
rfc: "0080-api-compare-jsdoc-metadata"
cluster: api-compare
deps: ["no-rails-equivalent-tag-extractor-support"]
deps-rfc: []
est-loc: 200
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Migrate abstractcontroller extra-surface allow entries to inline tags

## Context

14 `extra-surface-allow.json` entries, package `abstractcontroller`:

- `callbacks.ts` — `beforeAction`, `afterAction`, `aroundAction`,
  `skipBeforeAction`, `skipAfterAction`, `skipAroundAction` (Rails defines
  the `_action` macros metaprogrammatically in
  `abstract_controller/callbacks.rb`; the Ruby extractor only records
  literal `def`s). Declarations live in
  `packages/abstractcontroller/src/callbacks.ts`.
- `base.ts` — the same six names at their `static x = x` install sites
  (CLAUDE.md module-mixin pattern; the extractor counts the static field as
  base.ts surface). `packages/abstractcontroller/src/base.ts`.
- `caching.ts` — `setCacheStore` (writer half of Rails'
  `cache_store=`; name collision with the reader forces the `set` prefix).
- `trailties/routes-helpers.ts` — `withRoutesHelpers` (`with` is an ES
  strict-mode reserved word), `trailtieRoutesUrlHelpers` (host-side hook
  slot for Rails::Engine's `railtie_routes_url_helpers`).

Depends on the extractor-support story (tag must be honored first).

## Acceptance criteria

- Each listed method carries `@noRailsEquivalent` with its allow.json
  reason preserved (verbatim or lightly tightened, meaning intact).
- The 14 abstractcontroller entries are deleted from
  `extra-surface-allow.json`.
- `pnpm api:compare && pnpm api:extra` passes with identical
  novel/moved/allowed totals for the package (extras become tag-allowed
  instead of JSON-allowed; no stale entries, no new extras).
- Diff within the 500-LOC ceiling.
