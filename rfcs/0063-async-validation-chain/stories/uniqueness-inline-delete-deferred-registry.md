---
title: "Run uniqueness inline in valid?; delete _asyncValidations registry"
status: draft
updated: 2026-07-07
rfc: "0063-async-validation-chain"
cluster: null
deps: ["flip-activerecord-isvalid-async"]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

With the chain async (RFC 0063-async-validation-chain), uniqueness no
longer needs the deferred registry. Converge `validatesUniqueness` to a
normal validator running inside `valid?`, mirroring Rails
`vendor/rails/activerecord/lib/active_record/validations/uniqueness.rb`.

- `packages/activerecord/src/validations/uniqueness.ts:60-68` — pushes
  `{attribute, options, declaringClass}` into the per-class
  `_asyncValidations` registry instead of registering a validator.
- `packages/activerecord/src/base.ts:3303` — `_runAsyncValidations`
  drains the registry at save time; `:3390-3398` the STI-reset plumbing.
  Delete registry, drain, and plumbing; also the belongs_to touchpoint in
  `packages/activerecord/src/associations/builder/belongs-to.ts`.
- Sibling deviation fixed here: `async-validations-honor-validation-context`
  — once uniqueness runs inside the context-threaded chain
  (`_validationContext`, validations.ts:158-171), `on:` / context options
  behave like any other validator. Add coverage.
- The `SELECT 1 ... WHERE attr = ?` scope/case-sensitivity behavior should
  port from the Rails validator; keep whatever the current registry
  implementation already got right (see
  `uniqueness-validation.test.ts` for existing coverage).

## Acceptance criteria

- `await record.isValid()` returns `false` on a uniqueness collision
  before any save (Rails `valid?` parity); errors populated with the
  Rails message/details.
- `_asyncValidations` and `_runAsyncValidations` are deleted repo-wide
  (grep-gate zero).
- Uniqueness respects validation context (`on: :create` etc.) — test
  ported from Rails `uniqueness_validation_test.rb`.
- Uniqueness test file passes on all three adapter lanes.
