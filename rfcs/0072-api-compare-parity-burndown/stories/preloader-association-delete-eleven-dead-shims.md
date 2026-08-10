---
title: "Delete the 11 dead Rails-named shims in preloader/association.ts"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6188
claim: "2026-08-07T17:21:52Z"
assignee: "abstract-adapter-pool-readers-soften-rails-behaviour"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/associations/preloader/association.ts` carries 11
dead module-level functions at the bottom of the file, each named for a Rails
private and each reading through `(assoc as any)._xxx`. Nothing exports them,
nothing imports them, and nothing in `packages/activerecord/src` calls them —
verified by grep. They are the same pattern PR #6130 cleared out of
`preloader/through-association.ts` (ten shims) and partially out of this file
(`preloadScope`, `reflectionScope`, `cascadeStrictLoading`).

Remaining, at `association.ts` (line numbers as of 07bf64a):

| line | shim                      | Rails private (`preloader/association.rb`) |
| ---- | ------------------------- | ------------------------------------------ |
| 549  | `owners`                  | `owners`                                   |
| 554  | `reflection`              | `reflection`                               |
| 559  | `model`                   | `model`                                    |
| 564  | `ownerKeyName`            | `owner_key_name`                           |
| 569  | `associateRecordsToOwner` | `associate_records_to_owner`               |
| 574  | `isKeyConversionRequired` | `key_conversion_required?`                 |
| 579  | `deriveKey`               | `derive_key`                               |
| 584  | `convertKey`              | `convert_key`                              |
| 589  | `associationKeyType`      | `association_key_type`                     |
| 598  | `ownerKeyType`            | `owner_key_type`                           |
| 608  | `buildScope`              | `build_scope`                              |

A dead shim is worse than a missing method: `parity:api` counts it as the
ported private, so the invented `_`-prefixed method the code actually runs
never gets compared, and its divergences stay invisible.

## Converged shape

For each row: rename the live `_xxx` method on `Association` to the Rails name
(keeping any `@`-ivar-analogue backing field `_`-prefixed, as `@source_preloaders`
→ `_sourcePreloaders`), point every caller at it, and delete the shim. This is
what PR #6130 did for `preloadScope` / `reflectionScope` /
`cascadeStrictLoading` in this same file — follow that diff.

## Acceptance criteria

- All 11 shims deleted; every Rails private they stood in for is the live
  method's name, with every internal caller routed through it.
- No behavior change; the preloader and eager-loading suites stay green.
- `API_COMPARE_FORCE=1 pnpm parity:api --wide-calls` then `pnpm parity:api:calls`:
  newly-matched bodies will surface pre-existing divergence as new wide rows —
  converge what can be converged, and give a reviewed one-line reason to what
  cannot. Net row count must go down.
