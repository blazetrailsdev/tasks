---
title: "Migrate activerecord allow entries + ambient finder methods to inline tags"
status: draft
updated: 2026-07-26
rfc: "0080-api-compare-jsdoc-metadata"
cluster: api-compare
deps: ["no-rails-equivalent-tag-extractor-support"]
deps-rfc: []
est-loc: 150
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Migrate activerecord extra-surface allow entries + ambient finder methods to inline tags

## Context

Two `extra-surface-allow.json` entries, package `activerecord`, both in
`associations.ts` (`packages/activerecord/src/associations.ts`):

- `registerModel` — trails-only model registry (Ruby resolves association
  classes via `Reflection#compute_class` → `Object.const_get`,
  reflection.rb:434/:490; ESM has no constant namespace). Deliberately
  public — the canonical example of "tag, don't `@internal`".
- `initializeAssociations` — trails-only ESM module-cycle escape hatch.

Additionally, migrate the trails-only ergonomic finders injected via
`AMBIENT_RAILTIE_MIXINS["ActiveRecord::Base"].methods` in
`scripts/api-compare/extra-surface.ts:140-145` (`find_global_id`,
`find_signed_global_id`, `find_signed_global_id!` → the TS declarations the
globalid `wire` module registers onto Base): tag the TS declarations
`@noRailsEquivalent` (Rails apps call `GlobalID::Locator.locate` directly;
the model-side form is a trails invention) and delete the `methods` arm of
the ambient entry. The `includes` arm (railtie-injected
`GlobalID::Identification`) stays — it corrects a Ruby-extractor blind spot,
not a TS extra.

Depends on the extractor-support story.

## Acceptance criteria

- `registerModel`, `initializeAssociations`, and the three global-id finder
  declarations carry `@noRailsEquivalent` with reasons preserved.
- The two activerecord entries are deleted from `extra-surface-allow.json`;
  `AMBIENT_RAILTIE_MIXINS["ActiveRecord::Base"].methods` is removed
  (`includes` untouched).
- `pnpm api:compare && pnpm api:extra` passes with identical totals for
  activerecord (no stale entries, no new extras).
- Diff within the 500-LOC ceiling.
