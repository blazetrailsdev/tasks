---
title: "Un-skip autosave uniqueness-rollback tests (validates uniqueness routing + propagateErrors convergence)"
status: done
updated: 2026-06-19
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 3626
claim: "2026-06-19T02:48:28Z"
assignee: "autosave-uniqueness-rollback-and-error-format"
blocked-by: null
---

## Context

Part of the autosave residual burndown (RFC 0030). The two
`TestAutosaveAssociationValidationsOnAHasManyAssociation` rollback tests in
`packages/activerecord/src/autosave-association.test.ts`:

- `rollbacks whole transaction and raises ActiveRecord::RecordInvalid when
associations fail to #save! due to uniqueness validation failure`
- `rollbacks whole transaction when associations fail to #save due to
uniqueness validation failure`

Rails (`autosave_association_test.rb:2202-2236`) builds two unsaved
`PublishedBook`s on `@author.published_books` sharing isbn `"1234"`; `save!`
must raise `ActiveRecord::RecordInvalid` with message exactly
`"Validation failed: Published books is invalid"`, `save` must return false,
and the whole transaction rolls back (Author.count / Book.count unchanged).

These cannot be un-skipped until the canonical conversion of this file lands
(they need the canonical `Author`/`PublishedBook` models — see the 0019
conversion story), AND two implementation gaps converge:

1. **`validates(attr, { uniqueness: true })` is a no-op.** The AR `validates`
   override in `packages/activerecord/src/validations.ts` handles
   presence/absence/length/numericality but NOT `uniqueness:` — it falls
   through to ActiveModel, which has no DB-backed uniqueness validator. So the
   canonical `PublishedBook` (`this.validates("isbn", { uniqueness: true })`)
   never enforces uniqueness. Rails' AR `validates` routes `uniqueness:` to the
   DB-backed `UniquenessValidator` (the `_async_validations` registry, same path
   as `validatesUniqueness`). Fix: add a `uniqueness` branch to the override
   calling `this.validatesUniqueness(attribute, opts)`. (Verified locally: with
   this branch the autosave correctly raises RecordInvalid and rolls back.)

2. **Autosave save-phase error format diverges.** `propagateErrors`
   (`packages/activerecord/src/autosave-association.ts`) emits
   `errors.add("base", "invalid", { message: "<camelCaseAssocName> is invalid" })`
   PLUS a duplicate of every child full-message. With the uniqueness fix the
   message becomes `"publishedBooks is invalid, Isbn has already been taken"`,
   vs Rails' single humanized `errors.add(:published_books, :invalid)` →
   `"Published books is invalid"`. Converging `propagateErrors` to
   `errors.add(reflectionName)` (humanized, no child duplication) made these two
   tests pass locally but regressed other save-failure tests — so the
   convergence needs a careful audit of all four `propagateErrors` call sites
   (collection / hasOne / belongsTo / habtm) against Rails.

## Acceptance criteria

- [x] `validates(attr, { uniqueness: true })` routes to the DB-backed
      UniquenessValidator (behaves identically to `validatesUniqueness`), with a
      direct test in `uniqueness-validation.test.ts`.
- [x] `propagateErrors` (all 4 call sites) converges to Rails' save-phase error
      format without regressing existing autosave save-failure tests.
- [x] The two rollback tests are un-skipped (after the 0019 conversion) and pass
      against canonical SQLite (and PG/MySQL per the ruby gate), asserting the
      exact Rails message `"Validation failed: Published books is invalid"`.
