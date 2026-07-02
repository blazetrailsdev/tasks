---
title: "enum-negative-scope-warn-not-raise"
status: in-progress
updated: 2026-07-02
rfc: "0050-enum-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4415
claim: "2026-07-02T15:33:51Z"
assignee: "enum-negative-scope-warn-not-raise"
blocked-by: null
---

## Context

Surfaced converging `enum.test.ts` (PR #4318). Rails _warns_ when an enum
element's auto-generated negative scope (`not_*`) collides with a
positively-named element; trails' conflict-detection pass in
`packages/activerecord/src/enum.ts` `_enum` _raises_ an ArgumentError instead,
pre-empting `detectNegativeEnumConditionsBang` (which exists but is unwired).

## Acceptance criteria

Convert the negative-scope-clash case from a hard conflict error to the Rails
warning (via `detectNegativeEnumConditionsBang` / `setEnumWarn`), suppressed
under `scopes: false`. Then port these `enum_test.rb` cases in `enum.test.ts`:

- enum logs a warning if auto-generated negative scopes would clash with other enum names
- enum logs a warning if auto-generated negative scopes would clash with other enum names regardless of order
- enum doesn't log a warning if opting out of scopes

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
