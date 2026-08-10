---
rfc: "0092-parity-tools-consolidation"
title: "Compare-tooling consolidation: @blazetrails/parity"
status: closed
created: 2026-08-07
updated: 2026-08-10
owner: "@deanmarano"
packages: []
clusters: []
priority: 3
---

## Summary

Consolidate the organically-grown compare tooling (`scripts/api-compare`,
`scripts/test-compare`, `scripts/fixtures-compare`, `scripts/schema-compare`)
around the existing private workspace package **`@blazetrails/parity`**
(`scripts/parity`), restructured so the shared compare core is the heart of
the package and the current SQL parity-pipeline runner moves out of the way
under a `pipeline/` subtree. Unify orchestration and align file/script naming
across the four compare dirs.

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
   (`test:watch`, `test:db`) with compare tooling (`parity:test`,
   `parity:test:assertions`), while api-compare has its own `api:*`
   namespace and fixtures-/schema-compare have no scripts at all (CI invokes
   them by file path). Meanwhile `parity:*` (`parity:schema`, `parity:query`,
   `parity:validate`) is currently taken by the SQL pipeline runner.

## Design

`@blazetrails/parity` becomes the umbrella for Rails-parity tooling, with the
compare core as its heart. Five stories, each a standalone PR from `main`:

1. **Relocate the SQL parity pipeline** — move the current
   `scripts/parity` contents (`run.ts`, `canonical/`, `fixtures/`, `query/`,
   `schema/`, `translate/`) under `scripts/parity/pipeline/`, and rename its
   package.json scripts `parity:schema` / `parity:query` / `parity:validate`
   to `parity:pipeline:*`, freeing the package root and the `parity:*`
   namespace for the compare core. Update the ~15 `scripts/parity/...` path
   references in `.github/workflows/ci.yml`.
2. **Extract the shared compare core into `@blazetrails/parity`** — move the
   cross-consumed modules (`conventions.ts`, `unported-files.ts`,
   `write-json-manifest.ts`, the externally-consumed slice of `types.ts`)
   plus their tests to the package root; update all importers
   (api-compare, test-compare, schema-compare, rails-find) to import from
   `@blazetrails/parity`. Move-only, no behavior change.
3. **test-compare orchestrator** — port `test-compare/run.sh` to an
   `orchestrate.ts` modeled on api-compare's; single tsx process,
   `TEST_COMPARE_FORCE` env analogue replacing the bash `--cached` flag.
4. **File/naming alignment** — `test-compare.ts` → `compare.ts`; lint entry
   points follow `lint-<subject>.ts`; a README documenting the
   baseline/mark/exclude layout (all only-shrink). Baseline files themselves
   do not move.
5. **`parity:*` script namespace for the compare tools** — `parity:api` /
   `parity:test` / `parity:fixtures` / `parity:schema` (+ sub-commands
   `parity:api:calls` etc.), with the existing `api:*` / `parity:test` names
   kept as delegating aliases; alias removal and doc sweep is follow-up work
   once nothing references the old names. Note `parity:schema` is
   _repurposed_ — story 1 moved the pipeline's meaning to
   `parity:pipeline:schema` first.

Longer-term (out of scope here, enabled by this structure): the four compare
dirs themselves can migrate under `scripts/parity/` as subtrees once the core
is settled.

## Non-goals

- **Merging the four compare tools into one binary:** they compare different
  populations with different extractors; only the shared core consolidates.
- **Moving the compare dirs into `scripts/parity/` in this RFC:** each move
  churns CI filters and workflow paths; do it per-dir later once the core is
  stable, if at all.
- **Moving baseline/exclude files:** referenced by path from CI and lint
  tooling; churn there risks the serializeBaseline and sharded-mark traps for
  no organizational gain.
- **Deleting the old `api:*` / `parity:test` script names:** CLAUDE.md,
  CONTRIBUTING, docs, hooks, and agent prompts reference them; removal is a
  follow-up story after a reference sweep.

## Alternatives considered

- **New sibling package `@blazetrails/parity-tools`:** avoids touching the
  pipeline runner, but leaves two near-identical package names and puts the
  shared core in a satellite while the umbrella name stays on the narrower
  tool. Rejected in favor of restructuring `@blazetrails/parity` itself.
- **Plain `scripts/compare-shared/` directory (no package):** works but keeps
  brittle `../` relative imports; the workspace-package precedent already
  exists and gives a real import name.
- **`packages/parity`:** `packages/` is reserved for the Rails ports
  themselves; tooling packages live under `scripts/`.

## Rollout

Stories 1 → 2 are ordered (2 restructures the package 1 clears out); 3–5
follow 2 and are otherwise independent, each rebased on merged `main` — no
stacked branches. Verification per PR: `pnpm parity:api` /
`pnpm parity:test` deltas exactly zero, `pnpm parity:api:calls` / `pnpm parity:api:extra`
green, pipeline CI jobs (schema/query parity) green after the path moves.
