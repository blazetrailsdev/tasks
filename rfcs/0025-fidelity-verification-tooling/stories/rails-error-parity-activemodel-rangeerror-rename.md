---
title: "rails-error-parity: rename ActiveModelRangeError to RangeError (un-exclude errors.ts)"
status: ready
updated: 2026-07-14
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follows RFC 0025 bare-throw burndown continue-4 (PR #4856). `errors.ts` remains
in `eslint/rails-error-parity-exclude.json`: it has no bare throws, but
un-excluding activates the parity check's part-1 requirement of an exported
class **literally named `RangeError`** (manifest: `RangeError < ::RangeError`,
active_model/errors.rb:523). Ours is named `ActiveModelRangeError` and is
imported under that name across ~15 activerecord files + tests.

## Acceptance criteria

- [ ] Rename `ActiveModelRangeError` → `RangeError` in
      `packages/activemodel/src/errors.ts`, import-aliased at every use site to
      dodge the global collision (e.g. `import { RangeError as ... }`).
- [ ] Remove `packages/activemodel/src/errors.ts` from the exclude baseline.
- [ ] `pnpm lint` passes, rule stays `error`, baseline strictly smaller.
- [ ] api:compare/test:compare delta non-negative; standalone PR (cross-package
      rename), under 500 LOC.
