---
title: "enum-boolean-nil-string-value-support"
status: ready
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 10
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced converging `enum.test.ts` to the canonical `Book` model
(PR #4318). trails' `enum()` only supports integer-keyed mappings, so the
Rails `Book` enums for non-integer values are omitted (see
`packages/activerecord/src/test-helpers/models/book.ts` static block:
`cover { hard:"hard", soft:"soft" }`, `boolean_status { enabled:true,
disabled:false }`, `last_read { …, forgotten: nil }`). EnumType
(`packages/activerecord/src/enum.ts`) casts/serializes only string/number.

## Acceptance criteria

Implement boolean-valued, nil-valued, and string-valued enum support in
`EnumType` + `enum()`, wire the omitted `Book` enums (`cover`,
`boolean_status`, `last_read: forgotten`), then un-skip these
`enum_test.rb` cases in `enum.test.ts`:

- assign false value to a field defined as boolean
- assign nil value to enum which defines nil value to hash
- deserialize nil value to enum which defines nil value to hash
- deserialize enum value to original hash key
- find via where should be type casted

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
