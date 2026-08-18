---
title: "assertions-activesupport-cluster-tail-6"
status: done
updated: 2026-08-18
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6690
claim: "2026-08-18T12:26:48Z"
assignee: "assertions-activesupport-cluster-tail-6"
blocked-by: null
closed-reason: null
---

# Context

Remainder of `assertions-activesupport-cluster-tail-5` after the PR that
converged `configurable_test.rb` (0/0/0 — `Configuration#compileMethods` now
compiles real readers onto the anonymous `Configuration` subclass Rails' `config`
hosts, `InheritableOptions#inheritableCopy` is `self.class.new(self)` per
ordered_options.rb:134-136, and the port grew a Rails-shaped `Parent`/`Child`
with `foo`/`bar`/`baz`) and most of `json/encoding_test.rb`. activesupport
`scripts/test-compare/assertion-mismatch-mark.json` went 951 / 1327 / 130 →
942 / 1317 / 125.

Still outstanding, measured with
`pnpm parity:test -- --assertions --missing --package activesupport`
(count / kind / value):

| Rails test file                                     | count | kind | value | note                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------------------------------- | ----: | ---: | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test_case_test.rb`                                 |    31 |   36 |     3 | size                                                                                                                                                                                                                                                                                                                                                    |
| `callbacks_test.rb`                                 |    16 |   26 |     1 | our whole port is a rewrite: bespoke `{ log: [] }` targets instead of Rails' `Record`/`Person`/`PersonSkipper`/`AroundPerson`/`ConditionalPerson`/`CleanPerson`/`MySlate` fixtures. Converging needs those fixtures ported (~400 lines) first.                                                                                                          |
| `number_helper_test.rb`                             |    15 |   15 |     1 | needs implementation work first: `NumberConverter#execute` returns `String(null)` where Rails returns `nil` (`number_converter.rb:130-138`), `number_to_phone` has no `pattern:` option (`number_to_phone_converter.rb:54-56`), and the human-size / significant-digit arms drop most of Rails' cases.                                                  |
| `current_attributes_test.rb`                        |    12 |   14 |     2 | per-test ad-hoc `CurrentAttributes` subclasses instead of Rails' one `Current`. A ~280-line re-port.                                                                                                                                                                                                                                                    |
| `cache/cache_store_setting_test.rb`                 |     9 |   11 |     1 | our port never calls `Cache.lookupStore` (cache.ts:44) — it builds stores directly. The mem_cache / redis tests need `MemCacheStore` / `RedisCacheStore`, both unported.                                                                                                                                                                                |
| `xml_mini_test.rb`                                  |     5 |    5 |     0 | LEAVE. The five rows are `assert_raises(ArgumentError) { parser.call(Date.new(2013, 11, 12, 02, 11)) }`, which MRI raises from `Date.new`'s arity, not from the parser; trails' `Date.civil` ignores a fifth argument. Documented at xml-mini.test.ts:22-31.                                                                                            |
| `json/encoding_test.rb`                             |     1 |    2 |     0 | `utf8 string encoded properly` closes each pair with `assert_equal(Encoding::UTF_8, result.encoding)` — a JS string has no encoding, so 2 of 4 assertions have no counterpart. `time to json includes local offset` needs Rails' `with_env_tz "US/Eastern"` + `Time.local`, i.e. `process.env.TZ`, which is banned in this campaign's ported code.      |
| `json/decoding_test.rb`                             |     1 |    1 |     0 | Rails generates one test per `TESTS` row (`json/decoding_test.rb:18-83`) — 63 rows, each asserting once; ours collapses 26 into one `it("JSON decodes ")`. Converging means porting the whole `TESTS` table plus `with_tz_default "Eastern Time (US & Canada)"`, and several rows (`Time.new(2007, 1, 1, 1, 12, 34, "-05:00")`) will need decoder work. |
| `cache/stores/null_store_test.rb` (`local_store_*`) |     1 |    3 |     0 | needs `Cache::Strategy::LocalCache#with_local_cache`, unported                                                                                                                                                                                                                                                                                          |

The fix direction is Rails-ward: our test asserts what the Rails test asserts,
with the same assertion kinds in the same order and the same literal expected
values. Do not reword test names, and never reseed
`scripts/test-compare/assertion-mismatch-mark.json` upward.

## Acceptance criteria

- Each file above reports 0 assertion-count, 0 assertion-kind and 0
  assertion-value mismatches in
  `pnpm parity:test -- --assertions --package activesupport`, except
  `xml_mini_test.rb` and the two `json/encoding_test.rb` rows above, which are
  documented as having no TypeScript counterpart — leave them and cite the note.
- `scripts/test-compare/assertion-mismatch-mark.json` lowered by this story's
  contribution (activesupport is at 942 / 1317 / 125).
- No test name changes; the activesupport `pnpm parity:test` percent does not
  drop.
- If this is still larger than one PR, ship what fits and file the remainder.
