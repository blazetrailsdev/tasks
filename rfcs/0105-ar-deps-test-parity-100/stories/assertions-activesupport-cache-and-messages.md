---
title: "activesupport Cache / MessageVerifier / key-generation assertion parity"
status: done
updated: 2026-08-18
rfc: "0105-ar-deps-test-parity-100"
cluster: assertion-parity
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 6640
claim: "2026-08-17T10:49:51Z"
assignee: "assertions-activesupport-cache-and-messages"
blocked-by: null
closed-reason: null
---

## Context

RFC 0105 counts assertion parity, not only name parity: a test that matches
Rails by name but asserts a different number, a different kind, or a different
expected value than the Rails test is not a port of that test. PR #6507 widened
`ASSERTION_REPORT_PACKAGES` (`scripts/test-compare/compare.ts:76-88`) from
activerecord alone to the full RFC 0105 closure and seeded
`scripts/test-compare/assertion-mismatch-mark.json` at the measured values,
surfacing 5,036 divergences across the non-AR packages. The triage story
`burn-down-non-ar-assertion-parity-debt` split that total into this cluster and
its siblings; this one burns down the `activesupport` files below.

Measured 2026-08-14 (`pnpm parity:test -- --assertions --package activesupport`),
against `vendor/rails/activesupport/test/`:

| Rails test file                                     | count | kind | value |
| --------------------------------------------------- | ----: | ---: | ----: |
| `cache/stores/file_store_test.rb`                   |     7 |   11 |     4 |
| `cache/cache_store_setting_test.rb`                 |     9 |   11 |     1 |
| `encrypted_file_test.rb`                            |     4 |   11 |     1 |
| `cache/stores/memory_store_test.rb`                 |     5 |   11 |     0 |
| `key_generator_test.rb`                             |     7 |    7 |     0 |
| `cache/stores/null_store_test.rb`                   |     1 |    6 |     0 |
| `cache/behaviors/cache_store_behavior.rb`           |     1 |    5 |     0 |
| `security_utils_test.rb`                            |     3 |    3 |     0 |
| `message_pack/cache_serializer_test.rb`             |     2 |    2 |     0 |
| `secure_compare_rotator_test.rb`                    |     2 |    2 |     0 |
| `message_verifier_test.rb`                          |     1 |    2 |     0 |
| `cache/cache_store_namespace_test.rb`               |     0 |    2 |     0 |
| `cache/behaviors/cache_instrumentation_behavior.rb` |     0 |    1 |     0 |
| `messages/serializer_with_fallback_test.rb`         |     0 |    1 |     0 |
| `cache/behaviors/cache_store_coder_behavior.rb`     |     0 |    1 |     0 |
| `cache/behaviors/cache_delete_matched_behavior.rb`  |     0 |    1 |     0 |

**125 divergences** (42 assertion-count, 77 assertion-kind, 6
assertion-value). Expand per test with
`pnpm parity:test -- --assertions --missing --package activesupport` and grep for the
file; each line prints `rails N vs trails M`, and the kind lines print the
per-kind delta. The trails counterparts are at the convention TS path the same
report prints beside the Ruby file.

The fix direction is Rails-ward: our test asserts what the Rails test asserts,
with the same assertion kinds in the same order and the same literal expected
values (`assert_equal` -> `toEqual`, `assert_nil` -> `toBeNull`,
`assert_predicate`/`assert` -> the mapped kind in
`scripts/test-compare/assertion-kinds.ts`). Where the port legitimately cannot
mirror an assertion — a Ruby-only value protocol, an async surface that needs
`await expect(...)` — say so at the call site in a comment; do not reword the
test name (CLAUDE.md: test names are the parity key), and never loosen the
Rails side or reseed the mark upward.

If the cluster is larger than one PR, ship the files that fit and file the rest
as a sibling story under this RFC rather than growing the PR.

## Progress

PR #6640 converged 8 of the 16 files: `cache/cache_store_namespace_test.rb`,
`cache/stores/memory_store_test.rb`, `cache/stores/null_store_test.rb`
(every test but the two `local_store_*` ones),
`security_utils_test.rb`, `message_pack/cache_serializer_test.rb`,
`secure_compare_rotator_test.rb`, `message_verifier_test.rb`,
`messages/serializer_with_fallback_test.rb` — each now at 0 assertion-count /
0 kind / 0 value.

Still unconverged, and owned by `assertions-activesupport-cluster-tail`, which
records the specific blocker per file: `cache/stores/file_store_test.rb`,
`cache/cache_store_setting_test.rb`, `encrypted_file_test.rb`,
`key_generator_test.rb`, `cache/behaviors/cache_store_behavior.rb`,
`cache/behaviors/cache_instrumentation_behavior.rb`,
`cache/behaviors/cache_store_coder_behavior.rb`,
`cache/behaviors/cache_delete_matched_behavior.rb`, plus
`null_store_test.rb`'s `local_store_strategy` / `local_store_repeated_reads`
(they need `Cache::Strategy::LocalCache#with_local_cache`, unported).
`key_generator_test.rb` likewise needs an implementation convergence
(`KeyGenerator.hash_digest_class` + the Rails `inspect`) rather than a test edit.
Whoever picks this up should measure first, since the 8 above already report
clean.

## Acceptance criteria

- Every file listed above reports 0 assertion-count, 0 assertion-kind and 0
  assertion-value mismatches in `pnpm parity:test -- --assertions --package activesupport`.
- `scripts/test-compare/assertion-mismatch-mark.json` is lowered by exactly this
  story's contribution (the ratchet lowers on a passing run; never hand-edit it
  upward, and never lower a counter by narrowing a report scope or dropping a
  measured package).
- No test name changes; `pnpm parity:test` percent for activesupport does not drop.
- No new rows in `scripts/parity/unported-files/`.
