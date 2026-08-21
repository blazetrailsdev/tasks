---
title: "assertions-activesupport-cluster-tail-7"
status: ready
updated: 2026-08-21
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Context

Remainder of `assertions-activesupport-cluster-tail-6` after the PR that
converged `current_attributes_test.rb` (0/0/0) and the portable half of
`cache/cache_store_setting_test.rb`. activesupport
`scripts/test-compare/assertion-mismatch-mark.json` went 924 / 1272 / 109 →
908 / 1253 / 107.

Still outstanding, measured with
`pnpm parity:test -- --assertions --missing --package activesupport`
(count / kind / value):

| Rails test file                                     | count | kind | value | note                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------------------------------- | ----: | ---: | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test_case_test.rb`                                 |    31 |   36 |     3 | size — 712 Ruby lines vs 704 TS; the port asserts a different shape in most of `AssertionsTest`/`TestCaseTest`.                                                                                                                                                                                                                                         |
| `callbacks_test.rb`                                 |    16 |   26 |     1 | our whole port is a rewrite: bespoke `{ log: [] }` targets instead of Rails' `Record`/`Person`/`PersonSkipper`/`AroundPerson`/`ConditionalPerson`/`CleanPerson`/`MySlate` fixtures. Converging needs those fixtures ported (~400 lines) first.                                                                                                          |
| `number_helper_test.rb`                             |    15 |   15 |     1 | needs implementation work first: `NumberConverter#execute` returns `String(null)` where Rails returns `nil` (`number_converter.rb:130-138`), `number_to_phone` has no `pattern:` option (`number_to_phone_converter.rb:54-56`), and the human-size / significant-digit arms drop most of Rails' cases.                                                  |
| `cache/cache_store_setting_test.rb`                 |     6 |    6 |     1 | the six remaining rows are `test_mem_cache_*` and `test_redis_cache_store_*`, which need `Cache::MemCacheStore` / `Cache::RedisCacheStore` (both unported) plus `assert_called_with` on the Dalli client.                                                                                                                                               |
| `xml_mini_test.rb`                                  |     5 |    5 |     0 | LEAVE. The five rows are `assert_raises(ArgumentError) { parser.call(Date.new(2013, 11, 12, 02, 11)) }`, which MRI raises from `Date.new`'s arity, not from the parser; trails' `Date.civil` ignores a fifth argument. Documented at xml-mini.test.ts:22-31.                                                                                            |
| `json/encoding_test.rb`                             |     1 |    2 |     0 | LEAVE. `utf8 string encoded properly` closes each pair with `assert_equal(Encoding::UTF_8, result.encoding)` — a JS string has no encoding. `time to json includes local offset` needs `with_env_tz "US/Eastern"`, i.e. `process.env.TZ`, banned in this campaign.                                                                                      |
| `json/decoding_test.rb`                             |     1 |    1 |     0 | Rails generates one test per `TESTS` row (`json/decoding_test.rb:18-83`) — 63 rows, each asserting once; ours collapses 26 into one `it("JSON decodes ")`. Converging means porting the whole `TESTS` table plus `with_tz_default "Eastern Time (US & Canada)"`, and several rows (`Time.new(2007, 1, 1, 1, 12, 34, "-05:00")`) will need decoder work. |
| `cache/stores/null_store_test.rb` (`local_store_*`) |     1 |    3 |     0 | needs `Cache::Strategy::LocalCache#with_local_cache`, unported.                                                                                                                                                                                                                                                                                         |

The fix direction is Rails-ward: our test asserts what the Rails test asserts,
with the same assertion kinds in the same order and the same literal expected
values. Do not reword test names, and never reseed
`scripts/test-compare/assertion-mismatch-mark.json` upward.

## Acceptance criteria

- Each file above reports 0 assertion-count, 0 assertion-kind and 0
  assertion-value mismatches in
  `pnpm parity:test -- --assertions --package activesupport`, except
  `xml_mini_test.rb` and the two `json/encoding_test.rb` rows marked LEAVE,
  which have no TypeScript counterpart — leave them and cite the note.
- `scripts/test-compare/assertion-mismatch-mark.json` lowered by this story's
  contribution (activesupport is at 908 / 1253 / 107).
- No test name changes; the activesupport `pnpm parity:test` percent does not
  drop.
- If this is still larger than one PR, ship what fits and file the remainder.
