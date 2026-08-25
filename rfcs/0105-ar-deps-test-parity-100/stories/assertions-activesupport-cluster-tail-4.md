---
title: "assertions-activesupport-cluster-tail-4"
status: done
updated: 2026-08-17
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6652
claim: "2026-08-17T14:10:20Z"
assignee: "assertions-activesupport-cluster-tail-4"
blocked-by: null
closed-reason: null
---

## Context

Remainder of `assertions-activesupport-cluster-tail-3` after the PR that
converged `testing/method_call_assertions_test.rb` — a full re-port of the
Rails file (the `Level` fixture class with `increment` / `decrement` / `<<`,
all 24 tests in Rails' order and shapes), plus the implementation fixes it
needed in `packages/activesupport/src/testing/method-call-assertions.ts`:

- the file raised its own private `Assertion` class; it now raises the shared
  `Assertion` from `testing/assertions.ts` (Rails' `Minitest::Assertion`), so a
  test can catch what Rails catches;
- `assert_mock` raises a new exported `MockExpectationError` (mirrors
  `Minitest::MockExpectationError`, method_call_assertions.rb:20-27), which is
  what Rails' `test_assert_called_with_failure` expects;
- the private `assert_equal` now formats minitest's message
  (`"#{msg}.\nExpected: …\n  Actual: …"`), which the Rails failure tests assert
  verbatim.

`scripts/test-compare/assertion-mismatch-mark.json` for activesupport went
983 / 1367 / 130 → 973 / 1356 / 130.

Still outstanding, measured with
`pnpm parity:test -- --assertions --package activesupport`
(count / kind / value):

| Rails test file                                     | count | kind | value | note                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------------- | ----: | ---: | ----: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test_case_test.rb`                                 |    31 |   38 |     5 | size                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `callbacks_test.rb`                                 |    16 |   26 |     1 | size                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `xml_mini_test.rb`                                  |     5 |   25 |    13 | size                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `number_helper_test.rb`                             |    16 |   16 |     1 | size                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `current_attributes_test.rb`                        |    12 |   14 |     2 | our port is a rewrite: per-test ad-hoc `CurrentAttributes` subclasses instead of Rails' one `Current` (counter_integer / counter_callable / world / account / person / request, `delegate :time_zone`, `before_reset`, `resets`). A ~280-line re-port.                                                                                                                                                                                                          |
| `json/encoding_test.rb`                             |     4 |    7 |     3 | `hash encoding` / `utf8 string encoded properly` / `hash key identifiers are always quoted` / `nested hash with float` / `exception to json` / the two `as_json returns Infinity/NaN` tests use raw `JSON.stringify` instead of `ActiveSupportJSON.encode`. Note `test_hash_encoding` encodes `a: :b` — our encoder has no Symbol handling (`packages/activesupport/src/json/encoding.ts`), so converging that arm needs an encoder decision first.             |
| `configurable_test.rb`                              |     6 |    5 |     2 | the `configuration is crystalizeable` test needs `Configuration#compile_methods!`, unported (our `compileMethods` is a no-op); the rest (extra `assert_equal`s, the `:bar` default value, the third `NameError` case, the four `assert_not_respond_to`s) is mechanical. `assert_not_respond_to` is still UNMAPPED in `scripts/test-compare/assertion-kinds.ts` (only `assert_respond_to` is there) — mapping it will surface pre-existing divergence elsewhere. |
| `cache/stores/file_store_test.rb`                   |     7 |   11 |     4 | size                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `cache/cache_store_setting_test.rb`                 |     9 |   11 |     1 | our port never calls `Cache.lookupStore` (cache.ts:44) — it builds stores directly. The mem_cache / redis tests need `MemCacheStore` / `RedisCacheStore`, both unported, so those five cannot converge without dropping to `it.skip`, which lowers the matched percent.                                                                                                                                                                                         |
| `json/decoding_test.rb`                             |     1 |    1 |     0 | Rails generates one test per `TESTS` row (`json/decoding_test.rb:18-83`); ours collapses 26 into one `it("JSON decodes ")`                                                                                                                                                                                                                                                                                                                                      |
| `cache/stores/null_store_test.rb` (`local_store_*`) |     1 |    3 |     0 | needs `Cache::Strategy::LocalCache#with_local_cache`, unported                                                                                                                                                                                                                                                                                                                                                                                                  |
| `cache/behaviors/cache_store_behavior.rb`           |     1 |    5 |     0 | size                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

The fix direction is Rails-ward: our test asserts what the Rails test asserts,
with the same assertion kinds in the same order and the same literal expected
values. Do not reword test names, and never reseed
`scripts/test-compare/assertion-mismatch-mark.json` upward.

## Acceptance criteria

- Each file above reports 0 assertion-count, 0 assertion-kind and 0
  assertion-value mismatches in
  `pnpm parity:test -- --assertions --package activesupport`.
- `scripts/test-compare/assertion-mismatch-mark.json` lowered by this story's
  contribution (activesupport is at 973 / 1356 / 130).
- No test name changes; the activesupport `pnpm parity:test` percent does not
  drop.
- If this is still larger than one PR, ship what fits and file the remainder.
