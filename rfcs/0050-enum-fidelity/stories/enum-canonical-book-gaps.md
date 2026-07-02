---
title: "enum-canonical-book-gaps"
status: claimed
updated: 2026-07-02
rfc: "0050-enum-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-02T14:33:52Z"
assignee: "enum-canonical-book-gaps"
blocked-by: null
---

## Context

Surfaced while porting `packages/activerecord/src/enum.test.ts` to a faithful
mirror of `vendor/rails/activerecord/test/cases/enum_test.rb` (RFC 0048,
converge-finder-enum-relation-one-schema). The faithful port rides the canonical
`Book` model + `books` fixtures; the cases below are kept under their Rails names
and `it.skip`-ped as tracked-pending-convergence because the trails enum surface
can't yet express them.

## Gaps to converge

1. **`cover` string enum** — Rails `enum :cover, { hard: "hard", soft: "soft" }`;
   trails `enum()` rejects non-integer values, so `Book.covers`, `cover: :soft`,
   and `cover` predicates/bangs are absent. (book.ts:150-151)
2. **`boolean_status` boolean enum** — `enum :boolean_status, { enabled: true,
disabled: false }`; same non-integer limitation.
3. **`last_read` `forgotten: nil`** — trails enum can't map a label to `nil`, so
   `Book.forgotten`, `where(last_read: :forgotten)`, and the "forgotten"
   deserialize cases diverge.
4. **`EnumType#cast` passthrough** — Rails returns the unmapped value unchanged;
   trails returns `nil`. ("type.cast")
5. **In-memory DB-default seeding through `EnumType#cast`** — `new Book()` does
   not seed the `status` column default (0 → "proposed") until the row
   round-trips. ("uses default value from database on initialization",
   "enum labels as keyword arguments", "option names can be used as label")
6. **`false` treated as blank** — Rails casts `status = false` to `nil`; trails
   raises ArgumentError. ("assign false value to a field defined as not boolean")
7. **`changed_attributes` old-value hash** — trails `changedAttributes` is a
   `string[]` of names, not a name→old-value map. ("enum changed attributes")
8. **`*_before_type_cast` / `*_for_database` for enums**.
9. **macro-level `validate:` / `default:` / `scopes:` / `instance_methods:`
   options** on `enum()`.
10. **`status_change` accessor**, frozen `statuses`, and enum redefinition
    per-class / inheritable behavior.

## Acceptance criteria

- [ ] Pick off the gaps above (or split further), converging trails' `enum()` /
      `EnumType` to Rails so the corresponding skipped cases in `enum.test.ts`
      un-skip. Each converged gap drops its `it.skip` back to `it`.
