---
title: "Port the three unported postgresql/bit_string_test.rb tests"
status: done
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: 5
pr: trails#7924
claim: "2026-09-21T12:39:21Z"
assignee: "port-pg-bit-string-remaining-three"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/test/cases/adapters/postgresql/bit_string_test.rb` defines six
tests; `packages/activerecord/src/adapters/postgresql/bit-string.test.ts` matches three.
`parity:test --package activerecord --assertions --missing` reports the file as
`3 matched / 3 missing / 6 extra (TS only)`.

Missing:

- `test_default` (bit_string_test.rb:48-54) — `column_defaults["a_bit"]` and the generated
  reader on a new record both answer `"00000011"`; same pair for `a_bit_varying` / `"0011"`.
  Four `assert_equal`.
- `test_schema_dumping` (:56-61) — `dump_table_schema("postgresql_bit_strings")` emits
  `t.bit "a_bit", limit: 8, default: "00000011"` and the `t.bit_varying` twin. Two
  `assert_match`.
- `test_roundtrip` (:69-) — create with `a_bit: "00001010"`, `a_bit_varying: "0101"`, assert
  both readers plus `assert_nil` on the two undeclared columns, then reassign, `save!` and
  reload.

The table is declared in the test's own `setup` (:15-20) with `t.bit` / `t.bit_varying`, so
this is a Rails-side bespoke table, not the canonical schema — mirror Rails' `setup`.

The six TS-only tests should be reviewed at the same time: any that duplicate a Rails test
under a different name should be renamed onto the Rails name rather than left as extras.

## Acceptance criteria

- The three tests ported under their Rails names into the existing
  `adapters/postgresql/bit-string.test.ts`.
- Assertion kinds/counts match Rails.
- `parity:test` reports the file with 0 missing.
