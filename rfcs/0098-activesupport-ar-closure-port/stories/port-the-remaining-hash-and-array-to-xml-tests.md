---
title: "Port the remaining Rails HashToXmlTest / ToXmlTest cases"
status: in-progress
updated: 2026-08-21
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6826
claim: "2026-08-21T15:50:42Z"
assignee: "wave-4c-ar-core-residue-attributes-remainder-part-3"
blocked-by: null
closed-reason: null
---

## Context

trails#6818 ported `Hash#to_xml` / `Array#to_xml` and enrolled `HashToXmlTest` /
`ToXmlTest`, but shipped only part of each Rails class because the PR was at its
LOC ceiling. These Rails tests exist and are NOT ported:

From `vendor/rails/activesupport/test/core_ext/hash_ext_test.rb` (class
`HashToXmlTest`, `@xml_options = { root: :person, skip_instruct: true, indent: 0 }`):

- `test_one_level_dasherize_false` (:477)
- `test_one_level_camelize_true` (:491)
- `test_one_level_camelize_lower` (:498)
- `test_one_level_with_skipping_types` (:524)
- `test_two_levels` (:543)
- `test_three_levels_with_array` (:565)
- `test_from_xml_disallows_symbol_and_yaml_types_by_default` (:906)
- `test_from_xml_array_many` (:921)
- `test_roundtrip_to_xml_from_xml` (:972)

From `vendor/rails/activesupport/test/core_ext/array/conversions_test.rb`
(class `ToXmlTest`):

- `test_to_xml_with_dedicated_name` (:139)
- `test_to_xml_with_options` — ported; `test_to_xml_with_indent_set` (:159) is not
- `test_to_xml_dups_options` (:217)

The trails seats are `packages/activesupport/src/hash-ext.test.ts`
(`describe("HashToXmlTest")`) and `packages/activesupport/src/collections.test.ts`
(`describe("ToXmlTest")`). Both already carry the Rails `@xml_options` setup, so
each addition is the Rails body transcribed.

Note `test_one_level_with_yielding` IS ported, and the `resident: :yes` term of
`test_one_level_with_types` is deliberately omitted — that belongs to
[[converge-xmlmini-symbol-representation-onto-colon-strings]], not here.

## Acceptance criteria

- [ ] Each Rails test above is ported under its Rails name (underscores to
      spaces per the repo convention) with Rails' own assertions.
- [ ] `pnpm parity:test` delta is non-negative.
- [ ] No bespoke helpers — the existing `xmlOptions` const is the Rails setup.
