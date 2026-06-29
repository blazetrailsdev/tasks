---
title: "Converge integration.test.ts cacheKey + named-scoping STI partial-decl models (warming remainder)"
status: done
updated: 2026-06-29
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 350
priority: 1
pr: 0
claim: null
assignee: null
blocked-by: null
---

## Context

Continuation of `converge-partial-decl-models-updated-at` (PR #3569), which was
marked done but only converged `cache-key.test.ts` and `associations.test.ts`.
Two files still break once the RFC 0030 `virtual-reconcile-warm-schema-cache`
warming is applied (verified by re-applying the warming on top of merged main):

1. **integration.test.ts** — 5 cacheKey tests (`cache key for existing record is
not timezone dependent`, `cache key format for existing record with updated
at`, `cache key changes when child touched`, `cache key for updated on`,
   `cache key format is precise enough`). They declare a bespoke
   `class Developer extends Base` with `attribute("updated_at"/"updated_on")`,
   but the canonical `developers` table has `legacy_updated_*`, NOT
   `updated_at`/`updated_on` (`test-helpers/test-schema.ts:608`). Warming merges
   the real columns and the faked `updated_at` no longer round-trips
   write→cacheKey (cacheKey reads create-time, not the written value). Rails'
   `IntegrationTest` uses models whose table genuinely has `updated_at`/`updated_on`
   (`vendor/rails/activerecord/test/cases/integration_test.rb`) — port those
   models/tables, do not fake columns on `developers`.

2. **scoping/named-scoping.test.ts** — `subclass merges scopes properly`
   (line ~854): bespoke STI `Animal`/`Dog` declared via `attribute("name")`.
   Warming changes the model's awareness of the real `type`/columns, so
   `Dog.where({name})` returns 0 after create. Port to the canonical STI model
   Rails uses in `named_scoping_test.rb`.

Both are grandfathered-style bespoke partial declarations (named-scoping IS in
`eslint/require-canonical-schema-exclude.json`; integration is not listed but is
still bespoke). The warming exposes them because it converges
`columnNames`/`attributeNames` to the real DB columns (Rails-faithful).

## Acceptance criteria

- [ ] Open the corresponding Rails test FIRST; port models/tables/assertions
      word-for-word (test names unchanged — `test:compare` matches on names).
- [ ] Replace bespoke partial-declaration models with canonical models +
      `useHandlerFixtures` on tables that genuinely have the needed columns
      (updated_at/updated_on, STI `type`). Never fake a column the canonical
      table lacks.
- [ ] Keep cacheKey expectations Rails-faithful (timestamp embedded when
      `cache_versioning` off and the table has updated_at/updated_on).
- [ ] Remove `scoping/named-scoping.test.ts` from
      `eslint/require-canonical-schema-exclude.json` in its converting PR.
- [ ] With this landed AND the warming re-applied, all of integration.test.ts +
      named-scoping.test.ts pass. (Validation only — the warming itself lands via
      `virtual-reconcile-warm-schema-cache`.)
- [ ] Per-file PRs off `main`, non-overlapping, each ≤500 LOC.

## Definition of done

integration.test.ts and named-scoping.test.ts use canonical models/fixtures with
Rails-faithful cacheKey/STI behavior and pass with the schema-cache warming
applied. Faking columns to dodge the merge is NOT done.
