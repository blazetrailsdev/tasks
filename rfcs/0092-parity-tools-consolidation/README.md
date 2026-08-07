---
rfc: "0092-parity-tools-consolidation"
title: "Compare-tooling consolidation: @blazetrails/parity-tools"
status: draft
created: 2026-08-07
updated: 2026-08-07
owner: "@deanmarano"
packages: []
clusters: []
---

## Summary

Consolidate the organically-grown compare tooling (`scripts/api-compare`,
`scripts/test-compare`, `scripts/fixtures-compare`, `scripts/schema-compare`)
around a shared private workspace package `@blazetrails/parity-tools`, unify
orchestration, and align file/script naming across the four directories.

## Motivation

The compare scripts grew in four directions with no shared home:

1. **Shared utilities live inside `api-compare` by accident.**
   `scripts/test-compare/test-compare.ts:68-69` imports
   `../api-compare/unported-files.js` and `../api-compare/conventions.js`;
   `scripts/rails-find/core.ts:15` imports `ApiManifest` from
   `../api-compare/types.js`; `scripts/schema-compare/compare.ts:42` imports
   `../api-compare/write-json-manifest.js`. There is no neutral shared
   location, so every new tool deepens the accidental dependency on
   api-compare internals.
2. **Orchestration asymmetry.** `scripts/api-compare/run.sh` delegates to
   `orchestrate.ts` (single tsx process running the fetch → ruby∥ts extract →
   compare DAG with FORCE/REFRESH cache semantics). `scripts/test-compare/run.sh`
   is still the bash shape api-compare migrated away from: 3–4 separate
   `pnpm tsx` spawns (~1.7s cold start each, per api-compare's own run.sh
   header) plus an ad-hoc `--cached` flag handled in bash.
3. **Naming drift.** The main entry is `compare.ts` in api-, fixtures-, and
   schema-compare but `test-compare.ts` in test-compare; lint entry points are
   `lint-*` in api-compare but split `lint-*` / `*-ratchet` in test-compare.
4. **package.json namespace.** The `test:*` prefix mixes vitest runners
   (`test:watch`, `test:db`) with compare tooling (`test:compare`,
   `test:assertions:ratchet`), while api-compare has its own `api:*`
   namespace and fixtures-/schema-compare have no scripts at all (CI invokes
   them by file path).

## Design

Four stories, each a standalone PR from `main`, in dependency order:

1. **`@blazetrails/parity-tools` package** — new private workspace package at
   `scripts/parity-tools/` (precedent: `@blazetrails/parity` at
   `scripts/parity`, `@blazetrails/guides-typecheck`). Move the
   cross-consumed modules (`conventions.ts`, `unported-files.ts`,
   `write-json-manifest.ts`, the externally-consumed slice of `types.ts`)
   plus their tests; update all importers to the package name. Move-only, no
   behavior change.
2. **test-compare orchestrator** — port `test-compare/run.sh` to an
   `orchestrate.ts` modeled on api-compare's; single tsx process,
   `TEST_COMPARE_FORCE` env analogue replacing the bash `--cached` flag.
3. **File/naming alignment** — `test-compare.ts` → `compare.ts`; lint entry
   points follow `lint-<subject>.ts`; a README documenting the
   baseline/mark/exclude layout (all only-shrink). Baseline files themselves
   do not move.
4. **`parity:*` script namespace** — `parity:api` / `parity:test` /
   `parity:fixtures` / `parity:schema` (+ sub-commands `parity:api:calls`
   etc.), with the existing `api:*` / `test:compare` names kept as delegating
   aliases; alias removal and doc sweep is follow-up work once nothing
   references the old names.

Naming note: `@blazetrails/parity` (the SQL parity-pipeline runner) already
exists. `parity-tools` carries the description "shared core for the
Rails-comparison tooling: conventions, manifests, baselines, caching" to keep
the two distinct.

## Non-goals

- **Merging the four compare tools into one binary:** they compare different
  populations with different extractors; only the shared core consolidates.
- **Moving baseline/exclude files:** referenced by path from CI and lint
  tooling; churn there risks the serializeBaseline and sharded-mark traps for
  no organizational gain.
- **Deleting the old `api:*` / `test:compare` script names:** CLAUDE.md,
  CONTRIBUTING, docs, hooks, and agent prompts reference them; removal is a
  follow-up story after a reference sweep.

## Alternatives considered

- **Plain `scripts/compare-shared/` directory (no package):** works but keeps
  brittle `../` relative imports; the workspace-package precedent already
  exists and gives a real import name.
- **`packages/parity-tools`:** `packages/` is reserved for the Rails ports
  themselves; tooling packages live under `scripts/`.
- **`@blazetrails/parity-core` / `compare-core`:** rejected on naming review;
  `parity-tools` chosen.

## Rollout

Each story is independently mergeable. Story 1 first (others touch files it
moves); 2–4 in any order after, each rebased on merged `main` — no stacked
branches. Verification per PR: `pnpm api:compare` / `pnpm test:compare`
deltas exactly zero, `pnpm api:calls` / `pnpm api:extra` green, moved tests
running under the new vitest project registration.
