---
title: "where() on enum column: OOR bignum and Range endpoints via EnumType"
status: ready
updated: 2026-07-08
rfc: "0050-enum-fidelity"
cluster: null
deps: ["where-enum-serializes-numeric-string-and-label-arrays"]
deps-rfc: []
est-loc: 80
priority: 33
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails "find via where with large number"
(vendor/rails/activerecord/test/cases/enum_test.rb:139-144) exercises `where`
on an enum column with 64-bit out-of-range values and ranges:

```ruby
Book.where(status: [2, 9223372036854775808]).first        # array w/ OOR bignum
Book.where(status: ["2", "9223372036854775808"]).first     # numeric strings
Book.where(status: 2..9223372036854775808).first           # range
Book.where(status: "2".."9223372036854775808").first       # string range
```

Rails serializes each element/bound through `EnumType` → subtype; the unknown
bignum stays numeric and the integer subtype's range check collapses the OOR
bound via `Unboundable` (trails already threads Unboundable collapse per
PR #4433 for plain integer columns). trails keeps this test skipped
(`packages/activerecord/src/enum.test.ts:153`) — the enum predicate path does
not serialize array elements / range endpoints through `EnumType`, and numeric
strings fail `EnumType#cast` (reverse mapping keyed by number).

Sibling story `where-enum-serializes-numeric-string-and-label-arrays` covers
the scalar numeric-string and label-array shapes (enum_test.rb:104-138); this
story covers the remaining shapes of the large-number test: OOR bignum inside
an enum array, and Range (numeric + string endpoints) over an enum column.
Both stories touch the predicate-builder enum serialization funnel
(packages/activerecord/src/relation/predicate-builder.ts + type/enum path), so
schedule after the sibling merges.

## Acceptance criteria

- [ ] `where({ enumCol: [label-or-number, <OOR bignum>] })` serializes each
      element through `EnumType` and collapses the OOR element per the
      Unboundable threading (matches Rails result: finds the row for the
      in-range value).
- [ ] `where({ enumCol: range })` with numeric and numeric-string endpoints
      serializes endpoints through `EnumType` (numeric strings cast like
      Rails), returning the Rails result.
- [ ] Un-skip `enum.test.ts` "find via where with large number" (name
      unchanged).
