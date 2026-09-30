---
title: "OrderedHash: port the !omap builtin type, to_yaml_type and encode_with"
status: draft
updated: 2026-09-29
rfc: "0170-psych-in-ruby-compat"
cluster: fidelity
packages: ["activesupport"]
deps: ["psych-omap", "psych-load-tags-dump-tags-and-domain-types"]
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activesupport/lib/active_support/ordered_hash.rb:5-13`
(`YAML.add_builtin_type("omap")` building an `OrderedHash` from the pairs),
`:25-27` `to_yaml_type` (`"!tag:yaml.org,2002:omap"`) and `:29-31`
`encode_with` (`coder.represent_seq` of single-pair hashes). trails'
`packages/activesupport/src/ordered-hash.ts` has none of these. Its test is
`ordered-hash.test.ts` (`vendor/rails/v8.0.2/activesupport/test/ordered_hash_test.rb:251-306`:
`test_each_after_yaml_serialization`, `test_order_after_yaml_serialization`,
`…_with_nested_arrays`, `test_psych_serialize`, `test_psych_serialize_tag`,
`test_has_yaml_tag`).

## Acceptance criteria

- [ ] The builtin type is registered at module load. `toYamlType` and
      `encodeWith` are ported. `Coder#represent_seq` comes from
      `psych-scalar-and-tag-visitors`. If that has not landed, this criterion is
      `BLOCKED:` on it.
- [ ] The six `ordered_hash_test.rb` YAML tests run unskipped.

## Verification

`pnpm vitest run packages/activesupport/src/ordered-hash.test.ts`.
