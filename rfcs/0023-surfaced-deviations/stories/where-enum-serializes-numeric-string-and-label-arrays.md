---
title: "where() serializes numeric-string and label-array enum values through EnumType"
status: ready
updated: 2026-06-30
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while porting `packages/activerecord/src/enum.test.ts` to a faithful
mirror of `vendor/rails/activerecord/test/cases/enum_test.rb` (PR #4339, RFC
0048). Rails' `find via where with values.to_s` / `symbols` / `strings`
(enum_test.rb:104-138) exercise `where()` on an enum column with values that the
trails predicate builder does NOT serialize through `EnumType`:

1. **Numeric-string-coerced values** — `Book.where(status: Book.statuses[:published].to_s)`
   i.e. `where({ status: "2" })`. trails matches `IS NULL` instead of `status = 2`,
   so `.first` returns nothing. (`EnumType#cast("2")` returns null because the
   reverse mapping is keyed by the number `2`, not the string `"2"`.)
2. **Arrays of enum labels** — `where({ status: ["published", "published"] })`.
   The numeric-array form (`[2, 2]`) works, but the label-array form is not
   mapped per-element through `EnumType`, so it also matches nothing.

These kept the following `enum.test.ts` cases pending (tracked-pending-convergence,
`it.skip` / inline notes): `find via where with values.to_s` (whole test),
and the array-of-label assertions inside `find via where with symbols` /
`find via where with strings`.

## Acceptance criteria

- [ ] `where({ enumCol: "<numeric-string>" })` serializes through `EnumType`
      (matches the mapped integer), and `where({ enumCol: ["<label>", ...] })`
      maps each array element through the enum type.
- [ ] Un-skip `find via where with values.to_s` and the array-of-label
      assertions in the symbol/string cases of `enum.test.ts`; drop their pending
      notes.
