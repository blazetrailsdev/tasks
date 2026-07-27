---
title: "api:build phase 3: opt-in stub generation with @nie throws and stubbed reporting column"
status: ready
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 450
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Phase 3 of `docs/infrastructure/api-build-stub-generation-plan.md` (PR #5229): opt-in stub generation. Per the doc: stubs from `compare.ts` `missingMethods` per FileResult; position via `mergeBySourceLine` (`scripts/api-compare/source-order.ts:34`) + the `rails-file-structure-method-order` ESLint autofix as belt-and-braces; body = `@nie disposition=TODO rails=<file:line>` annotated `throw new NotImplementedError(...)` (the `nie-requires-annotation` lint at `eslint/nie-requires-annotation.mjs` fails bare throws); per-package `{ class, importPath }` NotImplementedError map (activerecord `src/errors.ts:162`, activemodel `src/attribute-assignment.ts:310`, arel `src/errors.ts:41`, activesupport `src/cache/store.ts:11`, trailties `src/generators/migration.ts:32` — NOT actionpack's HTTP-501 `NotImplemented` at `action-controller/metal/exceptions.ts:90`; hoisting an actionpack errors-module class is a small prerequisite inside this story). Gate on the "stubbed" reporting column first so parity % stays honest (annotated-throw-only bodies are mechanically recognizable), and emit the stub's tags into the baselines so the wide ratchet doesn't go red (doc §Ratchet interaction).

## Acceptance criteria

- `pnpm api:build --package <p> --file <f> --stubs` (opt-in, no build-everything default) generates ordered stubs with full `@missingRailsCall` blocks.
- Stub pairs reported in a "stubbed" column, excluded from matched %, excluded from `body-pins --pin-all`.
- New stubs do not fail `api:calls:wide` (baseline rows emitted in the same change).
