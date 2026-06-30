---
title: "converge-nested-attributes-test-one-schema"
status: claimed
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-30T23:24:50Z"
assignee: "converge-nested-attributes-test-one-schema"
blocked-by: null
---

## Context

Split out from `converge-persistence-validations-one-schema` (PR deleting the
bespoke top-level `validations.test.ts` + `autosave.test.ts`). `nested-attributes.test.ts`
is a separate file under the 500-LOC ceiling and converts all-or-nothing, so it
gets its own story per CLAUDE.md no-fan-out rule.

`packages/activerecord/src/nested-attributes.test.ts` (2393 LOC) imports canonical
models + fixtures but its header still reads "Tests to increase Rails test coverage
matching" and it declares ad-hoc tables. Faithful-audit it against
`vendor/rails/activerecord/test/cases/nested_attributes_test.rb` (1237 LOC):
mirror the Rails class describe names, confirm every Rails test case is present
under its exact name, drop trails-invented `it(...)` with no Rails counterpart,
and eliminate ad-hoc tables in favor of canonical `TEST_SCHEMA`. Also confirm
the companion `nested_attributes_with_callbacks_test.rb` is covered by
`nested-attributes-with-callbacks.test.ts` (may be a separate sub-task).

## Acceptance criteria

- [ ] Every `it(...)` maps 1:1 to a Rails `def test_*` in nested_attributes_test.rb;
      no trails-invented test names.
- [ ] Every Rails `def test_*` has a faithful port; Rails class names mirrored as
      `describe(...)`.
- [ ] Canonical schema/models/fixtures only; no ad-hoc tables, no `_tableName`
      hack, no invented columns. Add to `TEST_SCHEMA` if schema.rb has it.
- [ ] Surfaced impl gaps fixed to match Rails or filed under 0023-surfaced-deviations
      and marked tracked-pending-convergence.

## RFC 0048 working notes (added 2026-07-01)

Two conventions apply when (re)writing tests under this RFC:

- **Use the fixtures helper; do not hand-call `registerModel`.** The
  Rails-faithful `fixtures()` / `setupFixtures()` surface is merged (#4345; the
  old `useHandlerFixtures` / `setupHandlerSuite` call sites were renamed to
  `fixtures` / `setupFixtures` in #4346). Declaring a fixture set now
  **auto-registers its model on resolution** (#4348,
  `fixtures-register-model-on-resolution`) — mirroring Rails `fixtures :authors`.
  So declare the fixture set and let resolution register the model; do **not**
  add manual `registerModel(...)` lines for a fixture-backed model. (Association
  targets that have no fixture set of their own may still need an explicit
  register until the autoload fallback lands.)
- **`*.trails.test.ts` holds trails-only cases.** The `<name>.test.ts` file is a
  faithful word-for-word mirror of its Rails source. Any test case with **no
  Rails counterpart** (a trails-specific extension) belongs in a sibling
  `<name>.trails.test.ts` file — keep it out of the Rails-mirrored `.test.ts` so
  `test:compare` maps cleanly.
