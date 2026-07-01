---
title: "enum-validate-option"
status: ready
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 9
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced converging `enum.test.ts` (PR #4318). trails' `enum()`
(`packages/activerecord/src/enum.ts` `_enum`) accepts a `validate` option key
(listed in `assertValidEnumOptions`) but does not consume it — no validation is
wired, so `enum :status, [...], validate: true` is a no-op.

## Acceptance criteria

Honor the `validate:` option (Rails adds an inclusion validation; `validate:
{ allow_nil: true }` etc. forwards the hash to the validator). Then port these
`enum_test.rb` cases in `enum.test.ts`:

- validation with 'validate: true' option
- validation with 'validate: hash' option

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
