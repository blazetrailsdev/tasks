---
title: "Add non-blocking CI parity job"
status: ready
updated: 2026-07-08
rfc: "0000-typescript-7-native-compiler"
cluster: null
deps: ["typecheck-parity-script"]
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Phase 1 of RFC 0000-typescript-7-native-compiler. Surface tsgo drift in CI
without gating merges yet.

- Add a CI job to `.github/workflows/ci.yml` that runs
  `scripts/typecheck-parity.mjs` after `pnpm build`.
- Mark it non-blocking (`continue-on-error` or an explicitly
  non-required check) so drift is visible but does not block merges while
  the allowlist is still being curated.
- Reuse the existing build cache action (`./.github/actions/cache-build`)
  as the neighboring typecheck jobs do.

## Acceptance criteria

- CI runs the parity script on every PR and reports its result.
- The job cannot block a merge (non-required / continue-on-error).
- Required jobs (`Build & Type Check`, `guides-typecheck`) are unchanged.
