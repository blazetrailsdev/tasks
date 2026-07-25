---
title: "Port test_callbacks_on_child_when_parent_autosaves_child onto canonical Eye/Iris"
status: done
updated: 2026-07-25
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5281
claim: "2026-07-25T01:18:52Z"
assignee: "port-callbacks-on-child-when-parent-autosaves-child"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while merging PR #5251
(`eye-callbacks-cold-cache-has-one-read-diverges-from-rails`), which ported
`autosave_association_test.rb:294-311` (`test_callbacks_firing_order_on_create`
/ `_on_update` / `_on_save`) onto the canonical `Eye` / `Iris` models.

The very next Rails test in that file,
`test_callbacks_on_child_when_parent_autosaves_child`
(`vendor/rails/activerecord/test/cases/autosave_association_test.rb:313-322`),
is still a bespoke stand-in in trails:
`packages/activerecord/src/autosave-association.test.ts:1163` declares
`CbParent` (on `authors`) / `CbChild` (on `books`) and asserts only that a
`child_after_save` string landed in a log array.

Rails asserts six distinct counters on the canonical `Iris`
(`before_validation` / `before_create` / `before_save` / `after_validation` /
`after_create` / `after_save` each == 1) after `Eye.create!(iris: Iris.new)`.
Our `Iris` model already carries every one of those counters
(`packages/activerecord/src/test-helpers/models/eye.ts`) — nothing new is
needed on the model side.

Note this test's `iris: Iris.new` path goes through the _warm_ reader branch
(`SingularAssociation#reader` returns synchronously for an in-memory target),
so it exercises a different arm than #5251's cold-cache work.

Because `CbParent` / `CbChild` are invented names that collide with nothing
canonical, this is NOT covered by
`converge-autosave-association-unenumerated-canonical-shadows` or
`converge-autosave-association-remaining-canonical-shadows-arm-guard`, whose
site lists are keyed on shadowed canonical names.

## Acceptance criteria

- `callbacks on child when parent autosaves child` uses the canonical `Eye` /
  `Iris` models and asserts the six Rails counters verbatim.
- `CbParent` / `CbChild` and their bespoke `authors` / `books` declarations are
  deleted.
- Test name is unchanged (test:compare mapping).
