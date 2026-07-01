---
rfc: "0050-enum-fidelity"
title: "Enum fidelity"
status: draft
created: 2026-07-01
updated: 2026-07-01
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - "rails-deviation"
  - "followup"
related-rfcs:
  - "0023-surfaced-deviations"
  - "0048-one-schema-no-drop-tests"
---

# RFC 0050 — Enum fidelity

## Summary

Converge trails' `enum` surface (`packages/activerecord/src/enum.ts`) onto Rails'
`ActiveRecord::Enum`: accessor-level conflict detection, the value-method
generation path, DB-default suppression, aggregate deserialization, `where`
serialization, and the string-enum surface gaps. Extracted from the
`0023-surfaced-deviations` catch-all because the open enum work forms a coherent
mini-epic over a single file and test.

## Motivation

Six deviations surfaced while porting `enum.test.ts` to a faithful mirror of
`vendor/rails/activerecord/test/cases/enum_test.rb` (RFC 0048
converge-finder-enum-relation-one-schema). Each is a real Rails divergence but
none fit an existing topical RFC, so they accumulated in 0023.

## Design

Converge the enum path end-to-end:

- Route `_enum` value-method generation through
  `_enumMethodsModule().defineEnumMethods` (mechanism convergence) so later
  fixes attach to the Rails shape.
- Add `detect_enum_conflict!` for the enum's own accessor names
  (mapping/reader/writer) ahead of the per-value conflict pass.
- Stop marking the enum attribute type user-provided (which suppresses the DB
  column default on new records).
- Return integer keys from `min`/`max` aggregates; serialize numeric-string and
  label-array values through `EnumType` in `where()`.
- Close the canonical `Book` string-enum gaps (`enum :cover, { hard: "hard" }`).

## Non-goals

- **Non-AR enum callers:** out of scope; this RFC is `ActiveRecord::Enum` only.

## Rollout

1. `route-enum-generation-through-enum-methods-module` (mechanism first)
2. `enum-detect-conflict-for-accessor-names`,
   `enum-install-attribute-suppresses-db-default`,
   `enum-min-max-deserialize-in-aggregates`,
   `where-enum-serializes-numeric-string-and-label-arrays`
3. `enum-canonical-book-gaps` (string-enum surface — largest change)

## Verification

The `it.skip`-ped enum cases in `enum.test.ts` un-skip and pass on all three
adapter lanes; `api:compare` enum-method parity holds.

## Open questions

None outstanding — all members are concrete, sized deviations.

## Stories

See `pnpm tasks list --rfc <this-rfc>`.

## Changelog

- 2026-07-01: initial RFC — extracted from 0023-surfaced-deviations.
