---
title: "converge-persistence-test-one-schema"
status: claimed
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-30T23:54:47Z"
assignee: "converge-persistence-test-one-schema"
blocked-by: null
---

## Context

Split out from `converge-persistence-validations-one-schema` (PR deleting the
bespoke top-level `validations.test.ts` + `autosave.test.ts`). That PR shipped
the two clearly-bespoke duplicate deletions; `persistence.test.ts` is a separate
file under the 500-LOC ceiling and converts all-or-nothing, so it gets its own
story per CLAUDE.md no-fan-out rule.

`packages/activerecord/src/persistence.test.ts` (1649 LOC) already rides canonical
`TEST_SCHEMA` + canonical models and uses `describe("PersistenceTest")` matching
Rails' class, so it is substantially converged. What remains is a faithful
word-for-word audit against `vendor/rails/activerecord/test/cases/persistence_test.rb`
(1676 LOC, 146 `def test_*`): confirm every Rails test case is present with its
exact name, drop any trails-invented `it(...)` that maps to no Rails test, and
add any missing Rails cases. Header still reads "Tests to increase Rails test
coverage matching" (the bespoke marker) — replace with the canonical
"Mirrors: activerecord/test/cases/persistence_test.rb" header.

## Acceptance criteria

- [ ] Every `it(...)` maps 1:1 to a `def test_*` in persistence_test.rb by name
      (test:compare mapping); no trails-invented test names remain.
- [ ] Every Rails `def test_*` in persistence_test.rb has a faithful port.
- [ ] Canonical schema/models/fixtures only; no bespoke tables, no `_tableName`
      hack, no invented columns. Add to `TEST_SCHEMA` if schema.rb has it.
- [ ] Surfaced impl gaps fixed to match Rails or filed under 0023-surfaced-deviations
      and marked tracked-pending-convergence; don't bend tests to pass.

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
