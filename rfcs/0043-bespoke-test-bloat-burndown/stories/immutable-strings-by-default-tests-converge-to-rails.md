---
title: "Converge immutable_strings_by_default tests to Rails schema-inference fidelity"
status: done
updated: 2026-06-25
rfc: "0043-bespoke-test-bloat-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 4104
claim: "2026-06-25T10:22:38Z"
assignee: "immutable-strings-by-default-tests-converge-to-rails"
blocked-by: null
---

## Context

PR #4060 wired `immutable_strings_by_default` into schema column-type resolution
(`model-schema.ts` `applyColumnsHash`: converts string types via
`toImmutableString()` when set — model_schema.rb:623-626). However the three
existing tests in `packages/activerecord/src/attributes.test.ts` named
`immutable_strings_by_default changes schema inference for string columns`,
`... retains limit information`, and `... does not affect \`attribute :foo, :string\``are stubs: they only round-trip an explicitly-declared`attribute("title","string")`and never set`Base.immutableStringsByDefault` nor assert the inferred type is the
immutable variant. They predate the wiring and do not exercise it.

Rails equivalents (attributes_test.rb:373-393) use `with_immutable_strings`, a
schema-inferred string column on `OverloadedType`, `reset_column_information`, and
assert `Type.lookup(:immutable_string).class === type_for_attribute("inferred_string")`,
plus limit retention and that explicit `attribute :foo, :string` is unaffected.

## Acceptance criteria

- Port the three tests to mirror Rails: set `immutableStringsByDefault`, reflect a
  schema-inferred string column, and assert the resolved type is the immutable
  variant (and limit retained / explicit declarations unaffected).
- Use canonical schema + a real model with an inferred string column; do not keep
  the explicit-`attribute()` stubs.
- Test names stay verbatim (they already match Rails).
