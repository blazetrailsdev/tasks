---
title: "unported-files-binary-test-false-marshal-exclusion"
status: in-progress
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4891
claim: "2026-07-15T12:49:23Z"
assignee: "binary-type-serialize-returns-data-wrapper"
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/unported-files.ts:504-509` excludes `binary_test.rb` from
test:compare with the reason:

> "Tests Marshal/YAML binary encoding of AR records. Ruby binary serialization
> formats have no Node.js equivalent."

That reason is **factually wrong**. Rails has three `binary_test.rb` files and
none contains `Marshal` or `YAML` (verified: `grep -c "Marshal\|YAML"` returns 0
for all three):

- `vendor/rails/activerecord/test/cases/binary_test.rb` — binary column
  round-trips: `test_mixed_encoding` (a `\x80` BINARY save/reload),
  `test_load_save` (reads ASSETS_ROOT files), `test_unicode_input_casting`
  (Ruby String encoding assertions).
- `vendor/rails/activemodel/test/cases/type/binary_test.rb` — `test_type_cast_binary`,
  `test_serialize_binary_strings`.
- `vendor/rails/activerecord/test/cases/arel/nodes/binary_test.rb`.

The entry's `testFile: "binary_test.rb"` has no leading `/`, so
`isTestFileUnported` (unported-files.ts:967-978) does a **plain substring match**
and excludes **all three** files across activerecord, activemodel and arel from
test:compare accounting entirely (`test-compare.ts:477` — `continue`).

This is measurable: #4891 ported and un-skipped Rails' `test_mixed_encoding` into
`packages/activerecord/src/binary.test.ts` (it passes on SQLite, PG and MySQL),
and the activerecord test:compare line did not move at all —
`7640/7812, 125 skipped` before and after. We already port
`packages/activemodel/src/type/binary.test.ts` (2 tests) and get no credit for
those either.

Discovered in review of #4891 (BinaryType#serialize returns the Data wrapper).
That PR deliberately did not touch the entry: removing it changes accounting for
three files across three packages, which is its own change with its own delta to
justify.

## Acceptance criteria

- [ ] Remove (or correctly narrow) the `binary_test.rb` entry in
      `scripts/api-compare/unported-files.ts` so it no longer excludes files on a
      false Marshal/YAML premise.
- [ ] If any of the three files still warrants exclusion, scope it with an
      anchored path (leading `/`) and a reason that matches the actual source —
      e.g. `test_load_save` needs ASSETS_ROOT binary fixtures + filesystem reads;
      `test_unicode_input_casting` asserts Ruby String encodings. Prefer
      per-test `tests:` exclusion over whole-file where only some cases are
      Ruby-only.
- [ ] Report the resulting test:compare delta for activerecord, activemodel and
      arel. A negative delta is acceptable here **only** if it is purely the
      accounting correction (previously-hidden Rails tests becoming visible) —
      state which tests newly appear and why they are unported.
- [ ] Audit whether other filename-keyed entries in `UNPORTED_FILES` are
      over-matching via substring the same way (the leading-`/` anchor exists
      precisely for this).
