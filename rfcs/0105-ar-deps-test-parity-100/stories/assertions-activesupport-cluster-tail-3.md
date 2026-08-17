---
title: "assertions-activesupport-cluster-tail-3"
status: done
updated: 2026-08-17
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6650
claim: "2026-08-17T13:40:20Z"
assignee: "assertions-activesupport-cluster-tail-3"
blocked-by: null
closed-reason: null
---

## Context

Remainder of `assertions-activesupport-cluster-tail-2` after the PR that
converged the three files that fit under the LOC ceiling:

- `array_inquirer_test.rb` and `string_inquirer_test.rb` — both re-ported
  against the Ruby, with `respond_to_missing?` / `method_missing` fidelity in
  `array-inquirer.ts` / `string-inquirer.ts` (a `Proxy` whose `has` trap is
  `respond_to_missing?` and whose `get` trap is `method_missing`, per
  `method-missing-proxy.ts`), new `assertRespondTo` / `assertNotRespondTo`
  helpers, and `assert_not_respond_to` / `refute_respond_to` added to
  `scripts/test-compare/assertion-kinds.ts` (they were unmapped).
- `parameter_filter_test.rb` — re-ported, with `filter`'s `params.dup` arm and
  `call`'s `params.class.new` / `each` / `[]=` arms taught about
  `HashWithIndifferentAccess` (parameter_filter.rb:85,124-131), and the
  duplicate `describe("ParameterFilterTest")` block deleted.

`scripts/test-compare/assertion-mismatch-mark.json` for activesupport went
996 / 1391 / 131 → 982 / 1373 / 131.

Still outstanding, measured with
`pnpm parity:test -- --assertions --package activesupport`
(count / kind / value):

| Rails test file                                     | count | kind | value | note                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----: | ---: | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `test_case_test.rb`                                 |    31 |   38 |     5 | size                                                                                                                                                                                                                                 |
| `callbacks_test.rb`                                 |    16 |   26 |     1 | size                                                                                                                                                                                                                                 |
| `xml_mini_test.rb`                                  |     5 |   25 |    13 | size                                                                                                                                                                                                                                 |
| `number_helper_test.rb`                             |    16 |   16 |     1 | size                                                                                                                                                                                                                                 |
| `current_attributes_test.rb`                        |    12 |   14 |     2 | size                                                                                                                                                                                                                                 |
| `testing/method_call_assertions_test.rb`            |    10 |   11 |     0 | a full 230-line re-port                                                                                                                                                                                                              |
| `json/encoding_test.rb`                             |     4 |    7 |     3 | size                                                                                                                                                                                                                                 |
| `configurable_test.rb`                              |     6 |    5 |     2 | the `configuration is crystalizeable` test needs `Configuration#compile_methods!`, unported; the rest (extra `assert_equal`s, the `:bar` default value, the third `NameError` case, the four `assert_not_respond_to`s) is mechanical |
| `cache/stores/file_store_test.rb`                   |     7 |   11 |     4 | size                                                                                                                                                                                                                                 |
| `cache/cache_store_setting_test.rb`                 |     9 |   11 |     1 | size                                                                                                                                                                                                                                 |
| `json/decoding_test.rb`                             |     1 |    1 |     0 | Rails generates one test per `TESTS` row (`json/decoding_test.rb:18-83`); ours collapses 26 into one `it("JSON decodes ")`                                                                                                           |
| `cache/stores/null_store_test.rb` (`local_store_*`) |     1 |    3 |     0 | needs `Cache::Strategy::LocalCache#with_local_cache`, unported                                                                                                                                                                       |
| `cache/behaviors/cache_store_behavior.rb`           |     1 |    5 |     0 | size                                                                                                                                                                                                                                 |

The fix direction is Rails-ward: our test asserts what the Rails test asserts,
with the same assertion kinds in the same order and the same literal expected
values. Do not reword test names, and never reseed
`scripts/test-compare/assertion-mismatch-mark.json` upward.

Note for whoever picks this up: `assertRespondTo` / `assertNotRespondTo` now
exist in `packages/activesupport/src/testing/assertions.ts` (exported from the
package index), and `notRespondTo` is a mapped canonical kind — so a Rails
`assert_not_respond_to` now COUNTS where it used to be unmapped. Converging one
file can therefore surface pre-existing divergence in an unrelated one (it did:
`json_serialization_test.rb › should not call methods on associations that dont
respond` was missing its `assert_not_respond_to` and had to be converged in the
same PR).

## Acceptance criteria

- Each file above reports 0 assertion-count, 0 assertion-kind and 0
  assertion-value mismatches in
  `pnpm parity:test -- --assertions --package activesupport`.
- `scripts/test-compare/assertion-mismatch-mark.json` lowered by this story's
  contribution (activesupport is at 982 / 1373 / 131).
- No test name changes; the activesupport `pnpm parity:test` percent does not
  drop.
- If this is still larger than one PR, ship what fits and file the remainder.
