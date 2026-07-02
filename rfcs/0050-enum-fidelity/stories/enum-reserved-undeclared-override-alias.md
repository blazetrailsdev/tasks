---
title: "enum-reserved-undeclared-override-alias"
status: claimed
updated: 2026-07-02
rfc: "0050-enum-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-02T15:46:02Z"
assignee: "enum-reserved-undeclared-override-alias"
blocked-by: null
---

## Context

Surfaced converging `enum.test.ts` (PR #4318). Three independent enum-parity
gaps in `packages/activerecord/src/enum.ts`:

- Reserved enum _names_ (`column`, `logger`, `attributes`) are not guarded —
  Rails raises; trails does not (`detectEnumConflictBang` only checks generated
  value method names).
- `enum` on an attribute with an undeclared type silently defaults the subtype
  to `integer` (try/catch in `_enum`); Rails raises on `type_for_attribute`.
- Re-defining an enum bang method (`def published!; super; end`) then declaring
  the enum raises a conflict in trails; Rails allows it (override via `super`).
- `alias_attribute` + `enum` on the alias does not resolve (the aliased enum
  attribute reads nil).

## Acceptance criteria

Implement the four behaviors and port these `enum_test.rb` cases in
`enum.test.ts`:

- reserved enum names
- raises for attributes with undeclared type
- overriding enum method should not raise
- enum with alias_attribute

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
