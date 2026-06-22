---
title: "isvalid-does-not-run-uniqueness-validations"
status: draft
updated: 2026-06-19
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

In Rails, `ActiveRecord::Validations#valid?` runs **all** validations, including
the DB-backed `UniquenessValidator` — Ruby's DB I/O is synchronous, so
`record.valid?` issues the `SELECT 1 ... WHERE <attr> = ?` immediately and
returns `false` on a collision.

trails diverges: validations are kept **sync-only** (the `isValid` /
`_superIsValid` chain runs `validatesWith`-registered validators synchronously),
but uniqueness can't do a sync DB round-trip in JS. So `validatesUniqueness`
(and now `validates(attr, { uniqueness: true })` — see PR #3626) register into a
separate `_asyncValidations` registry that is drained only at save time by
`Base._runAsyncValidations` (`base.ts:2877`, awaited from `persistence.ts:689`).

Consequence: **`record.isValid()` does not reflect uniqueness.** A record can
return `isValid() === true` and then fail `save()`/`saveBang()` due to a
uniqueness collision. Surfaced in review discussion of PR #3626
(autosave-uniqueness-rollback-and-error-format).

Nuance (why this is lower-severity than it looks): uniqueness validation in
Rails is itself a TOCTOU race by default — the `valid?` pre-check and the
subsequent `INSERT` are not atomic, so two concurrent requests can both pass
`valid?` and only the DB unique index (if present) prevents the dupe. The
robust pattern most code uses is to **not** depend on the `valid?` pre-check and
instead detect uniqueness from the failed insert / unique-constraint violation
after save. So trails' "uniqueness only at save" behavior is closer to the
correct concurrency story — but it still diverges from Rails' observable
`valid?` semantics, which is what this story tracks.

Related: [[async-validations-honor-validation-context]] (the `on:`/`if:`/
`unless:` guards on the same async path are also not honored).

Rails refs:

- `activerecord/lib/active_record/validations.rb` — `valid?` override runs the
  full validation chain (uniqueness included).
- `activerecord/lib/active_record/validations/uniqueness.rb` —
  `UniquenessValidator#validate_each` runs synchronously inside `valid?`.

## Acceptance criteria

- [ ] Decide and document the convergence target: either (a) make `isValid`
      run the async/uniqueness validations (requires an async `isValid` or a
      sync-DB shim — large, ripples through every `isValid` caller), or
      (b) ratify the divergence as an intentional concurrency-safer deviation
      with a `@internal`/docs note and a tracked-pending entry. Per repo policy,
      prefer converge over ratify unless there is a concrete blocker — capture
      the blocker if ratifying.
- [ ] If converging: `record.isValid()` returns `false` for a uniqueness
      collision against a persisted row, matching Rails, with direct tests in
      `uniqueness-validation.test.ts` (sync-looking call path) covering both
      `validatesUniqueness` and `validates(..., { uniqueness })`.
- [ ] Audit callers of `isValid` for async-ripple impact before changing the
      signature; note the blast radius in the story before implementation.
- [ ] No regression in the autosave save-phase rollback tests (PR #3626) or the
      existing `_asyncValidations` save-time behavior.
