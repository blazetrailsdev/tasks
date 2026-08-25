---
title: "parity:api:build: resolve 18 unmatched tag expectations (prototype-patched/mixin-duplicate methods)"
status: ready
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The whole-activerecord `parity:api:build` shakeout (PR #5229) left 18 of 3,960 expected tags with no body-bearing declaration in the artifact's `tsFile` — now printed as `unmatched (...)` by `scripts/api-compare/build.ts` instead of silently dropped. Concretely: prototype-patched adapter methods (`selectAll`, `execInsert/execUpdate/execDelete`, `execQuery`, `execDelete`, `cacheableQuery`, `selectValue` — interface signatures at `connection-adapters/abstract-adapter.ts:422-457`, implementations assigned via `AbstractAdapter.prototype.*` around line 2758), the mixin host-class duplicate `base.ts isChangedForAutosave` (defined in `autosave-association.ts`, which gets its own tags), and `encryption.ts tryToDecryptWithEach`. Decide per case: tag at the defining declaration (follow prototype assignments / mixin attribution), or record a documented skip rule in build.ts.

## Acceptance criteria

- A full `pnpm parity:api:build --package activerecord` run prints zero `unmatched` lines (each former case either tagged at its real declaration or covered by a documented, tested skip rule).
- Regression tests for the prototype-assignment and mixin-duplicate cases.

## Re-verified 2026-08-17 (ready sweep)

Sequencing note: this is the shakeout tail of `parity:api:build` and is
independent of the other three `api-build-*` stories — the 18 unmatched tags are
an attribution question, not a phase.
