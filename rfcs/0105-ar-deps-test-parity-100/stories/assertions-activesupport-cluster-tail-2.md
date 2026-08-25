---
title: "assertions-activesupport-cluster-tail-2"
status: done
updated: 2026-08-17
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6649
claim: "2026-08-17T13:10:28Z"
assignee: "assertions-activesupport-cluster-tail-2"
blocked-by: null
closed-reason: null
---

## Context

Remainder of `assertions-activesupport-cluster-tail` after PR #6641 shipped the
files that fit under the LOC ceiling. That PR converged, to 0 assertion-count /
0 kind / 0 value mismatches:

- `encrypted_file_test.rb`
- `key_generator_test.rb` (added `KeyGenerator.hashDigestClass` +
  ArgumentError setter and the Rails `inspect`, deleted the stray duplicate
  `describe`s and the copied BacktraceCleaner suite)
- `cache/behaviors/cache_delete_matched_behavior.rb`
- `cache/behaviors/cache_instrumentation_behavior.rb`
- `cache/behaviors/cache_store_coder_behavior.rb`

Still outstanding, measured with
`pnpm parity:test -- --assertions --package activesupport` after that PR
(count / kind / value):

| Rails test file                                     | count | kind | value | why it was left                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------- | ----: | ---: | ----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test_case_test.rb`                                 |    31 |   38 |     5 | size                                                                                                                                                                                                                                                                                                                                                             |
| `callbacks_test.rb`                                 |    16 |   26 |     1 | size                                                                                                                                                                                                                                                                                                                                                             |
| `xml_mini_test.rb`                                  |     5 |   25 |    13 | size                                                                                                                                                                                                                                                                                                                                                             |
| `number_helper_test.rb`                             |    16 |   16 |     1 | size                                                                                                                                                                                                                                                                                                                                                             |
| `current_attributes_test.rb`                        |    12 |   14 |     2 | size                                                                                                                                                                                                                                                                                                                                                             |
| `testing/method_call_assertions_test.rb`            |    10 |   11 |     0 | size — a full 230-line re-port                                                                                                                                                                                                                                                                                                                                   |
| `json/encoding_test.rb`                             |     4 |    7 |     3 | size                                                                                                                                                                                                                                                                                                                                                             |
| `parameter_filter_test.rb`                          |     7 |    7 |     0 | needs `filter`'s `params.dup` arm to preserve HWIA (`parameter_filter.rb:117`); trails' `call` uses `Object.entries`/index assignment (`packages/activesupport/src/parameter-filter.ts:179-197`), which sees nothing on a `HashWithIndifferentAccess` (its entries live in a private `Map`). Also a duplicate `describe("ParameterFilterTest")` block to delete. |
| `configurable_test.rb`                              |     6 |    5 |     2 | the `configuration is crystalizeable` test needs `Configuration#compile_methods!`, unported; the rest (extra `assert_equal`s, the `:bar` default value, the third `NameError` case, the four `assert_not_respond_to`s) is mechanical                                                                                                                             |
| `cache/stores/file_store_test.rb`                   |     7 |   11 |     4 | size                                                                                                                                                                                                                                                                                                                                                             |
| `cache/cache_store_setting_test.rb`                 |     9 |   11 |     1 | size                                                                                                                                                                                                                                                                                                                                                             |
| `array_inquirer_test.rb`                            |     4 |    7 |     0 | `assert_respond_to` / `assert_not_respond_to` need the Proxy to stop resolving every name (`array_inquirer.rb` `respond_to_missing?`), and the `assertRespondTo`/`assertNotRespondTo`/`assertNotPredicate` helpers from PR #6640                                                                                                                                 |
| `string_inquirer_test.rb`                           |     1 |    5 |     0 | same, plus `test_missing_question_mark`'s NoMethodError needs the `?`-only `method_missing` arm (`string_inquirer.rb`)                                                                                                                                                                                                                                           |
| `json/decoding_test.rb`                             |     1 |    1 |     0 | Rails generates one test per `TESTS` row (`json/decoding_test.rb:18-83`); ours collapses 26 into one `it("JSON decodes ")`                                                                                                                                                                                                                                       |
| `cache/stores/null_store_test.rb` (`local_store_*`) |     1 |    3 |     0 | needs `Cache::Strategy::LocalCache#with_local_cache`, unported                                                                                                                                                                                                                                                                                                   |
| `cache/behaviors/cache_store_behavior.rb`           |     1 |    5 |     0 | size                                                                                                                                                                                                                                                                                                                                                             |

The fix direction is Rails-ward: our test asserts what the Rails test asserts,
with the same assertion kinds in the same order and the same literal expected
values. Do not reword test names, and never reseed
`scripts/test-compare/assertion-mismatch-mark.json` upward.

## Acceptance criteria

- Each file above reports 0 assertion-count, 0 assertion-kind and 0
  assertion-value mismatches in
  `pnpm parity:test -- --assertions --package activesupport`.
- `scripts/test-compare/assertion-mismatch-mark.json` lowered by this story's
  contribution (activesupport is at 1008 / 1429 / 134 after PR #6641).
- No test name changes; the activesupport `pnpm parity:test` percent does not
  drop.
- If this is still larger than one PR, ship what fits and file the remainder.
