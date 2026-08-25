---
title: "assertions-activesupport-cluster-tail-5"
status: done
updated: 2026-08-17
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6654
claim: "2026-08-17T14:40:20Z"
assignee: "assertions-activesupport-cluster-tail-5"
blocked-by: null
closed-reason: null
---

## Context

Remainder of `assertions-activesupport-cluster-tail-4` after the PR that
converged three files fully — `xml_mini_test.rb` (rename_key literals, an
`assertXml` twin for Rails' `assert_xml`, truthiness for the `boolean`
parser), `cache/behaviors/cache_store_behavior.rb` and
`cache/stores/file_store_test.rb` (all eleven drifted tests re-ported against
the now-exported `FILENAME_MAX_SIZE`). activesupport
`scripts/test-compare/assertion-mismatch-mark.json` went 963 / 1342 / 130 →
955 / 1308 / 114.

Still outstanding, measured with
`pnpm parity:test -- --assertions --missing --package activesupport`
(count / kind / value):

| Rails test file                                     | count | kind | value | note                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------------- | ----: | ---: | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test_case_test.rb`                                 |    31 |   36 |     3 | size                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `callbacks_test.rb`                                 |    16 |   26 |     1 | our whole port is a rewrite: bespoke `{ log: [] }` targets instead of Rails' `Record`/`Person`/`PersonSkipper`/`AroundPerson`/`ConditionalPerson`/`CleanPerson`/`MySlate` fixtures. Converging needs those fixtures ported (~400 lines) first.                                                                                                                                                                                                                                  |
| `number_helper_test.rb`                             |    15 |   15 |     1 | needs implementation work first: `NumberConverter#execute` returns `String(null)` where Rails returns `nil` (`number_converter.rb:130-138`), `number_to_phone` has no `pattern:` option (`number_to_phone_converter.rb:54-56`), and the human-size / significant-digit arms drop most of Rails' cases.                                                                                                                                                                          |
| `current_attributes_test.rb`                        |    12 |   14 |     2 | per-test ad-hoc `CurrentAttributes` subclasses instead of Rails' one `Current` (counter_integer / counter_callable / world / account / person / request, `delegate :time_zone`, `before_reset`, `resets`). A ~280-line re-port.                                                                                                                                                                                                                                                 |
| `json/encoding_test.rb`                             |     4 |    7 |     3 | `hash encoding` / `utf8 string encoded properly` / `hash key identifiers are always quoted` / `nested hash with float` / `exception to json` / the two `as_json returns Infinity/NaN` tests use raw `JSON.stringify` instead of `ActiveSupportJSON.encode`. `test_hash_encoding` encodes `a: :b`, and our encoder has no Symbol handling (`json/encoding.ts`), so that arm needs an encoder decision first.                                                                     |
| `configurable_test.rb`                              |     6 |    5 |     2 | needs `Configuration#compile_methods!` (`configurable.rb:15-25`; our `compileMethods` is a no-op) and a Rails-shaped `Parent`/`Child` with `foo`/`bar`/`baz`. `assert_not_respond_to` is UNMAPPED in `scripts/test-compare/assertion-kinds.ts`; do NOT map it (it would surface pre-existing divergence elsewhere and red the only-shrink mark) — spell the trails side as an `assertNotRespondTo` helper, which is unmapped on both sides.                                     |
| `cache/cache_store_setting_test.rb`                 |     9 |   11 |     1 | our port never calls `Cache.lookupStore` (cache.ts:44) — it builds stores directly. The mem_cache / redis tests need `MemCacheStore` / `RedisCacheStore`, both unported.                                                                                                                                                                                                                                                                                                        |
| `xml_mini_test.rb`                                  |     5 |    5 |     0 | `symbol` / `integer` / `float` / `decimal` / `string` each close with `assert_raises(ArgumentError) { parser.call(Date.new(2013, 11, 12, 02, 11)) }`, which MRI raises from `Date.new`'s arity, not from the parser. trails' `Date.civil` takes four parameters and ignores a fifth argument at runtime (verified), so there is no faithful counterpart; the drop is documented at xml-mini.test.ts:22-31. Convergence is gated on trails growing Ruby arity checking, if ever. |
| `json/decoding_test.rb`                             |     1 |    1 |     0 | Rails generates one test per `TESTS` row (`json/decoding_test.rb:18-83`); ours collapses 26 into one `it("JSON decodes ")`                                                                                                                                                                                                                                                                                                                                                      |
| `cache/stores/null_store_test.rb` (`local_store_*`) |     1 |    3 |     0 | needs `Cache::Strategy::LocalCache#with_local_cache`, unported                                                                                                                                                                                                                                                                                                                                                                                                                  |

The fix direction is Rails-ward: our test asserts what the Rails test asserts,
with the same assertion kinds in the same order and the same literal expected
values. Do not reword test names, and never reseed
`scripts/test-compare/assertion-mismatch-mark.json` upward.

## Acceptance criteria

- Each file above reports 0 assertion-count, 0 assertion-kind and 0
  assertion-value mismatches in
  `pnpm parity:test -- --assertions --package activesupport`, except:
  - `xml_mini_test.rb`, whose five remaining rows are the vacuous `Date.new`
    arity assertion above — leave them and cite the comment.
  - `json/encoding_test.rb`'s `utf8 string encoded properly`, which follows each
    of its two `assert_equal` result checks with
    `assert_equal(Encoding::UTF_8, result.encoding)` (encoding_test.rb:74-82).
    A JS string is a UTF-16 code-unit sequence with no `Encoding` object to name
    — the same language shortcoming `SKIP_GROUPS` already cites for
    `Multibyte::Chars` (docs/ruby-ts-conventions.md) — so 2 of the 4 assertions
    have no counterpart. Port the two value assertions and leave the row at
    1 count / 1 kind; the drop is documented at encoding.test.ts's
    `utf8 string encoded properly`.
- `scripts/test-compare/assertion-mismatch-mark.json` lowered by this story's
  contribution (activesupport is at 955 / 1308 / 114).
- No test name changes; the activesupport `pnpm parity:test` percent does not
  drop.
- If this is still larger than one PR, ship what fits and file the remainder.
