---
rfc: "0000-async-validation-chain"
title: "Async validation chain (isValid returns Promise)"
status: draft
created: 2026-07-07
updated: 2026-07-07
owner: "@deanmarano"
packages:
  - "activemodel"
  - "activerecord"
  - "activesupport"
clusters:
  - "rails-deviation"
---

# Async validation chain

## Summary

Flip the validation chain from sync (`isValid(): boolean`) to async
(`isValid(): Promise<boolean>`), converging on Rails' observable `valid?`
semantics: the full validator chain — including the DB-backed
`UniquenessValidator` — runs when `valid?` is called, not deferred to save
time. This reverses the previously ratified sync-only-validations
architecture decision (decision reversed 2026-07-06).

## Motivation

The sync-only decision bought signature fidelity (`boolean` like Rails) at
the cost of behavioral infidelity: uniqueness is parked in a deferred
`_asyncValidations` registry (`packages/activerecord/src/validations/uniqueness.ts:60-68`)
drained only at save time by `Base#_runAsyncValidations`
(`packages/activerecord/src/base.ts:3303`). Consequence:
`record.isValid()` can return `true` and `save()` still fails on a
uniqueness collision — a permanent observable divergence documented as a
TRACKED DEVIATION at `packages/activerecord/src/validations.ts:128-155`,
classified blocked-on-architecture, gated on exactly this decision.

Behavioral fidelity beats signature fidelity: a ported Rails app behaves
differently under sync-only, while `await record.isValid()` behaves
identically modulo one keyword. JS has no synchronous DB I/O, so async is
the only shape in which DB-backed validators (uniqueness today; any
user-written DB-touching validator tomorrow) are first-class. Every mature
JS ORM landed here.

## Design

End state:

- `ActiveModel::Validations#valid?` / `#validate` / `run_validations!`
  return `Promise<boolean>` (`packages/activemodel/src/validations.ts:304`,
  `packages/activemodel/src/model.ts:1856`).
- `ActiveRecord::Validations#isValid` / `#validate`
  (`packages/activerecord/src/validations.ts:157-181`) are async and run
  the full chain including uniqueness inline, mirroring Rails
  `activerecord/lib/active_record/validations.rb#valid?`.
- The activesupport `strict: "sync"` validate-callback guard
  (`packages/activesupport/src/callbacks.ts:455`, `:1008-1010`) is removed;
  the validate chain accepts async callbacks like the save chain already
  does.
- The `_asyncValidations` deferred registry and `_runAsyncValidations`
  drain are deleted; `validatesUniqueness` registers a normal validator
  mirroring `activerecord/lib/active_record/validations/uniqueness.rb`.
- The sibling deviation `async-validations-honor-validation-context` is
  fixed for free once uniqueness runs inside the context-threaded chain.
- Lint enforcement (`@typescript-eslint/no-misused-promises` +
  `no-floating-promises` covering `isValid`/`validate` call sites) lands
  BEFORE the flip: `if (record.isValid())` on a forgotten await is always
  truthy and silent.

## Rollout

Strictly ordered — each story branches from main after the previous merges:

1. `lint-guard-unawaited-isvalid` — lint rails in place first.
2. `flip-activemodel-validation-chain-async` — AM chain + activesupport
   guard removal.
3. `flip-activerecord-isvalid-async` — AR isValid/validate/save path +
   the mechanical await sweep across AR tests (~154 call sites). This
   story necessarily exceeds the 500-LOC ceiling: the signature flip and
   the test sweep cannot be split across PRs (unawaited calls type-check
   but fail at runtime, so CI forces them into one PR). Ceiling waived
   for this story per the mechanical-sweep exemption; the non-mechanical
   core must stay small.
4. `uniqueness-inline-delete-deferred-registry` — move uniqueness into the
   chain, delete the registry, fix validation-context threading.
5. `async-validations-docs-and-deviation-cleanup` — remove the
   TRACKED DEVIATION blocks, stale sync-only comments/docs/memory, and
   verify parity against Rails' uniqueness validation tests.

## Non-goals

- Callback halt semantics (owned elsewhere).
- Making other AM surfaces async (attribute methods, dirty, etc.).

## Verification

- `record.isValid()` awaited returns `false` on a uniqueness collision
  before any save is attempted (Rails `valid?` parity).
- `_asyncValidations` / `_runAsyncValidations` no longer exist.
- Validation + uniqueness test files pass on all three adapter lanes;
  `test:compare` delta for validations/uniqueness suites is non-negative.
