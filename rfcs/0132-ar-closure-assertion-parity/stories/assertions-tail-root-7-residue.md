---
title: "assertions-tail-root-7-residue"
status: claimed
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: null
claim: "2026-09-21T13:41:59Z"
assignee: "assert-helper-only-tests-trip-the-missing-assertions-guard"
blocked-by: null
closed-reason: null
---

## Context

The residue left by `assertions-tail-root-7` (trails#TBD), which took
`attribute_methods_test.rb`, `migration/index_test.rb`, `calculations_test.rb`,
`schema_dumper_test.rb`, `null_relation_test.rb`,
`connection_adapters/connection_swapping_nested_test.rb`,
`relation/load_async_test.rb`, `prepared_statement_status_test.rb`,
`migration/create_join_table_test.rb`, `fixture_set/file_test.rb` and
`associations/eager_test.rb` from 69 mismatches to 15.

Every remaining row is in one of two classes, neither of which is a normal
convergence. This story exists to record them, and to be closed by ratifying
them or by fixing the tooling — NOT by softening a test.

### 1. `attribute_methods_test.rb` — 7 tests, ratified-unportable arms

Each of these Rails tests asserts through `method_missing` or through Ruby
method visibility, both of which CLAUDE.md ratifies as genuine TypeScript
language shortcomings (§ "Records are not Proxies", § "Method visibility is not
a runtime fact in JS"). The ported bodies already carry every assertion that
does NOT depend on the hook, which is exactly what those sections prescribe.

| test                                                                         | unportable arms                                                               |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `attribute keys on a new instance`                                           | `assert_raise(NoMethodError) { t.title2 }`                                    |
| `non-attribute read and write`                                               | two `assert_raise(NoMethodError)`                                             |
| `undeclared attribute method does not affect respond_to? and method_missing` | `assert_raise(NoMethodError)`                                                 |
| `attribute readers respect access control`                                   | `assert_not_respond_to`, `assert_raise`, `assert_includes … "private method"` |
| `attribute writers respect access control`                                   | same three                                                                    |
| `attribute predicates respect access control`                                | same three                                                                    |
| `bulk updates respect access control`                                        | two `assert_raise(UnknownAttributeError)` behind `privatize`                  |

Rails source: `vendor/rails/activerecord/test/cases/attribute_methods_test.rb:163-167,643-654,995-1030`.

### 2. `associations/eager_test.rb` — 1 test, extractor asymmetry

`eager with multiple associations with same table has many and habtm`
(`vendor/rails/activerecord/test/cases/associations/eager_test.rb:1028-1054`)
declares `def assert_equal_after_sort` INSIDE the test body and calls it three
times. The Ruby extractor counts the `def`'s two `assert_equal`s lexically AND
one per call site (the `assert_` prefix hits `assertion_method?`) — 7 total.

The TS extractor's `isInlineDef` guard
(`scripts/test-compare/extract-ts-core.ts:125-140`) deliberately counts an
inline helper ONLY where it is written and scores its call sites zero, so the
faithful TS mirror — a `function assertEqualAfterSort` declared in the test
body, called three times — scores 4. No rewrite of the test reaches 7 without
distorting it; the guard's own docstring says it exists for the Ruby LAMBDA
shape (`->(){}.call`), which is not the shape here.

## Acceptance criteria

- [ ] The `attribute_methods_test.rb` rows are ratified against the two
      CLAUDE.md sections above — recorded where the RFC records permanent
      assertion residue — or converged if a reader finds an arm that does port.
- [ ] `isInlineDef` distinguishes a Ruby `def`-shaped inline helper (call sites
      count) from a lambda-shaped one (call sites do not), OR the eager_test
      row is ratified as a tooling asymmetry.
- [ ] No test in either file is renamed, softened or deleted to close this.
