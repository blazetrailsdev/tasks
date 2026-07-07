---
title: "Flip AR isValid/validate async + mechanical await sweep (LOC waived)"
status: ready
updated: 2026-07-07
rfc: "0063-async-validation-chain"
cluster: null
deps: ["flip-activemodel-validation-chain-async"]
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Second half of the flip (RFC 0063-async-validation-chain): make
ActiveRecord's `isValid`/`validate` async and sweep awaits through the AR
call sites and tests.

- `packages/activerecord/src/validations.ts:157-181` — `isValid` (with
  the `_superIsValid` delegation registered by Base at `:112-116`) and
  `validate`. Both become async; the try/finally context save/restore
  around `_validationContext` must still restore on rejection.
- Save path: `perform_validations` in persistence must `await isValid`
  (Rails: `vendor/rails/activerecord/lib/active_record/validations.rb`
  `save`/`perform_validations`). Keep `_runAsyncValidations` drain in
  place for now — the deferred uniqueness registry is migrated and
  deleted by the follow-up story `uniqueness-inline-delete-deferred-registry`.
- Await sweep: ~154 `isValid()` call sites in
  `packages/activerecord/src/**/*.test.ts` plus non-test callers
  (e.g. `validations/associated.ts`, autosave paths). Unawaited calls
  type-check but fail at runtime, so the sweep cannot be split from the
  signature flip; lint from `lint-guard-unawaited-isvalid` catches
  misuse.
- `validates_associated` (`packages/activerecord/src/validations/associated.ts`)
  calls associated records' `isValid` — goes transitively async here.

**LOC ceiling waived for this story** (mechanical await sweep; per RFC
Rollout). Keep the non-mechanical core small and call out in the PR body
which files are pure `await` insertion.

## Acceptance criteria

- AR `isValid`/`validate` return `Promise<boolean>`; context
  save/restore survives rejection.
- `save`/`saveBang` await the validation chain; existing
  save-time uniqueness behavior unchanged (registry still drained).
- All touched AR test files pass; no test renamed; `test:compare` delta
  non-negative for validations suites.
