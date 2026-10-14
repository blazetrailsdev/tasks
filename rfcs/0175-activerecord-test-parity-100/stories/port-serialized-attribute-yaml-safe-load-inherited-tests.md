---
title: "Port the 24 tests SerializedAttributeTestWithYamlSafeLoad inherits"
status: in-progress
updated: 2026-10-14
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: trails#8896
claim: "2026-10-14T12:12:40Z"
assignee: "fixtures-nested-describe-inherits-regardless-of-call-order"
blocked-by: null
closed-reason: null
---

## Context

`test-compare-credits-tests-inherited-from-a-same-file-superclass` made the
Ruby extractor replay a same-file test superclass's tests under each subclass,
as Minitest runs them. `class SerializedAttributeTestWithYamlSafeLoad <
SerializedAttributeTest`
(`vendor/rails/v8.0.2/activerecord/test/cases/serialized_attribute_test.rb:579`)
redefines some of its superclass's tests and inherits the rest, so
`pnpm parity:test --package activerecord --missing` now reports 24 missing
tests for `serialized_attribute_test.rb`: the inherited ones, which Rails runs
a second time with `ActiveRecord.use_yaml_unsafe_load = false` (`:580-584`).

`describe("SerializedAttributeTestWithYamlSafeLoad")` in
`packages/activerecord/src/serialized-attribute.test.ts` ports only the tests
the subclass defines itself.

`migration/foreign-key.test.ts` is the precedent: its
`ForeignKeyChangeColumnWithPrefixTest` and `...WithSuffixTest` describes carry
the superclass's six tests again, each under the subclass's setup.

## Acceptance criteria

- [ ] The 24 inherited tests are ported under
      `describe("SerializedAttributeTestWithYamlSafeLoad")`, with the
      subclass's `setup` / `teardown`.
- [ ] `pnpm parity:test --package activerecord` reports
      `serialized_attribute_test.rb` 71/71.
