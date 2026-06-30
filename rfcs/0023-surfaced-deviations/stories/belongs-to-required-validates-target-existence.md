---
title: "Required belongs_to validates target existence, not just FK presence"
status: in-progress
updated: 2026-06-30
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 4307
claim: "2026-06-30T03:24:31Z"
assignee: "belongs-to-required-validates-target-existence"
blocked-by: null
---

## Context

PR #4270 converged required `belongs_to` presence validation to validate the
association name (Rails `BelongsToBuilder.define_validations`,
`activerecord-8.0.2/lib/active_record/associations/builder/belongs_to.rb:113-142`).
It added a trails-specific `!foreignKeyPresent(record)` guard to the validation
`if:` condition (`packages/activerecord/src/associations/builder/belongs-to.ts:~346`)
because trails validations are synchronous and cannot load an unloaded target.

The residual deviation: Rails' `validates_presence_of reflection.name` reads the
association, which **loads the record from the FK and checks it EXISTS**
(non-nil). trails instead treats any populated FK as satisfying presence, so a
required `belongs_to` whose FK points to a **deleted/nonexistent** parent passes
validation, whereas Rails fails with "must exist".

- trails impl: `packages/activerecord/src/associations/builder/belongs-to.ts`
  — `foreignKeyPresent` short-circuits the presence check when all FK columns
  (and polymorphic types) are non-blank, regardless of whether the row exists.
- Root constraint: validations are sync-only ([[trails-validations-are-sync-only]]),
  so existence cannot be verified during `isValid()`.

## Acceptance criteria

- [ ] A required `belongs_to` with a populated FK pointing at a nonexistent row
      fails validation with "must exist", matching Rails
      (`read_attribute_for_validation` loading nil → presence error).
- [ ] Mechanism stays faithful: either an async validation path or a
      `before_save`/load-time existence check that does not regress the
      synchronous `isValid()` contract.
- [ ] `create({ parentId: <valid id> })` and `record.parent = Parent.new`
      success branches still pass (no regression in `associations/required.test.ts`
      or `belongs-to-associations.test.ts`).
- [ ] No regression in `api:compare` / `test:compare` deltas.
