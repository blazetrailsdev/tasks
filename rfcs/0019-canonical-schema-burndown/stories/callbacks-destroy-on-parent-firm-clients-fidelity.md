---
title: "Use canonical Firm/clients for callbacks.test.ts destroy-on-parent test"
status: ready
updated: 2026-06-21
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/activerecord/src/associations/callbacks.test.ts` was converted to
canonical models in PR #3758. The `has many callbacks for destroy on parent`
test (callbacks.test.ts, in the second `AssociationCallbacksTest` describe)
maps to Rails' `test_has_many_callbacks_for_destroy_on_parent`
(`vendor/rails/activerecord/test/cases/associations/callbacks_test.rb:105-111`),
which uses **`Firm#clients`** (a `dependent: :destroy` has_many with
before/after_remove logging to `firm.log`).

The PR instead runs the test on the `Author`→`Post` factory shared by the other
has_many tests, with `dependent: "destroy"` passed explicitly. Because canonical
`Post` has its own `dependent: :destroy` taggings/tags associations
(post.ts:233/239/246/252), the suite had to create empty `taggings`/`tags`
tables purely so `Post#destroy`'s cascade resolves. This is behavior-faithful
but diverges from Rails' chosen models and carries scaffolding tables unrelated
to the callback under test.

The canonical `Firm` model already has the exact association:
`packages/activerecord/src/test-helpers/models/company.ts:62-75` defines
`clients` (dependent destroy) with `logBeforeRemove`/`logAfterRemove` producing
`before_remove<id>`/`after_remove<id>` — matching the test's assertion verbatim.

## Acceptance criteria

- [ ] Convert `has many callbacks for destroy on parent` to use canonical
      `Firm`/`Client` (Company STI on `companies`) + the existing
      `clients` dependent:destroy callbacks, mirroring Rails 105-111.
- [ ] Drop the `taggings`/`tags` schema slice + `Tag`/`Tagging` registrations
      from this file if no other test still needs them after the move.
- [ ] Handle Firm#destroy's `account` (dependent:destroy) cascade — create the
      `accounts` table (and any other table the Firm/Client destroy path
      touches) in the suite setup.
- [ ] Test name preserved verbatim; all tests still pass.
