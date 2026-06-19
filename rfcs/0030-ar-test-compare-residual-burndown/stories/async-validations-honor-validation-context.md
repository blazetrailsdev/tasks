---
title: "async-validations-honor-validation-context"
status: in-progress
updated: 2026-06-19
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3627
claim: "2026-06-19T03:24:28Z"
assignee: "async-validations-honor-validation-context"
blocked-by: null
---

## Context

`Base._runAsyncValidations` (`packages/activerecord/src/base.ts:2877`) runs
deferred validations (currently only uniqueness, registered via
`validatesUniqueness` / the `_asyncValidations` registry) by constructing a
`UniquenessValidator` and calling `validator.validateEach(this, attribute,
value)` directly. It never calls `validator.validate()`, so the context guard
that `validatesWith` installs (via `callbacks.ts`'s `contextGuard` →
`options.if`, derived from `on:`) is never wired up.

Consequence: `on:`/`if:`/`unless:`/`strict:` options on a uniqueness validation
are silently ignored — `validates('isbn', { uniqueness: true, on: 'create' })`
(and the equivalent `validatesUniqueness('isbn', { on: 'create' })`) validate on
every save, not just on `:create`.

Surfaced in review of PR #3626 (autosave-uniqueness-rollback-and-error-format),
which made `validates(..., { uniqueness })` route into this path. As a stopgap
that PR strips `on`/`if`/`unless`/`strict` in the `validates` uniqueness branch
(`packages/activerecord/src/validations.ts`) so the unsupported keys aren't
silently forwarded — see the comment referencing this story slug.

Rails: `ActiveModel::Validations::Validator` honors the validation context via
the `:on`/`:if`/`:unless` guards installed when the validator is registered;
`UniquenessValidator` is no exception. trails diverges by short-circuiting to
`validateEach`.

## Acceptance criteria

- [ ] `_runAsyncValidations` honors `on:`/`if:`/`unless:` (and `strict:`) on
      uniqueness validations — a `{ uniqueness: true, on: 'create' }` rule
      validates only on create, matching Rails.
- [ ] Re-enable forwarding of those keys in the `validates(..., { uniqueness })`
      branch (remove the stopgap strip in `validations.ts`) and drop the
      `0030/async-validations-honor-validation-context` reference comment.
- [ ] Direct tests in `uniqueness-validation.test.ts` covering `on: 'create'`
      and `on: 'update'` for both `validates(..., { uniqueness })` and
      `validatesUniqueness`.
