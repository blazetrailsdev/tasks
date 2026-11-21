---
rfc: "0246-activesupport-parity-100"
title: "activesupport: 100% API and test parity"
status: active
created: 2026-11-18
updated: 2026-11-18
owner: "@deanmarano"
packages:
  - activesupport
  - scripts
clusters:
  - test-residuals
  - api-residuals
  - receipts
related-rfcs:
  - "0098-activesupport-ar-closure-port"
  - "0101-activesupport-out-of-closure-surface"
  - "0158-activesupport-assertion-surfaced-port-bugs"
  - "0245-i18n-test-parity-100"
priority: 2
---

# RFC 0246 — activesupport: 100% API and test parity

## Summary

Bring `packages/activesupport` to 100% on both `pnpm parity:api` and
`pnpm parity:test`. Every Rails public method needs a matched trails member,
and every Rails test needs a name-matched trails test. The only exception is
something that is permanently unportable under a ratified CLAUDE.md section
and carries the receipt that section prescribes. Today activesupport is at
**94.5% API (2162/2289)** and **93.9% tests (3481/3706)**.

This RFC owns every story that moves either number. Thirteen open stories that
did were filed in RFCs 0101 and 0158. They are moved here (see "Stories moved
in"), so the RFC's completion does not depend on another RFC's status.

## Motivation

Measured on 2026-11-18 at trails `4d6bf61e04`, after a clean `pnpm build`, in
a fresh worktree:

```text
pnpm parity:test -- --package activesupport
activesupport — 3481/3706 tests (93.9%) (56 skipped, 5 wrong describe,
  1 assertion-count-mismatch, 3 assertion-kind-mismatch, 252 extra)
  | 164/167 files | 1 misplaced
  AR closure: 2058/2148 (95.8%) | out of closure: 1423/1558 (91.3%)

pnpm parity:api -- --package activesupport --missing --arity --inheritance
activesupport — 2162/2289 methods (94.5%) | files: 213/218 | 3 misplaced
  | inheritance: 87/100 (87%) | arity: 1487/1491 (99.7%) | params: 913/913
  Ruby defs: 2544 — own row 2000 | excluded file 140 | rowless file 22
  | global skip 48 | scoped skip 54 | operator 56 | same-name collapse 224
```

### Test gap: 168 Miss

| Ruby test file                                      | Miss | Owner                                                  |
| --------------------------------------------------- | ---: | ------------------------------------------------------ |
| `inflector_test.rb`                                 |   52 | `activesupport-inflector-test-loop-residue`            |
| `safe_buffer_test.rb`                               |   44 | `activesupport-safe-buffer-unsafe-method-loop`         |
| `message_pack/cache_serializer_test.rb`             |   22 | `port-message-pack-shared-tests-into-cache-serializer` |
| `multibyte_chars_test.rb`                           |   14 | `activesupport-multibyte-chars-bang-methods`           |
| `core_ext/time_with_zone_test.rb`                   |   13 | `activesupport-time-with-zone-methods-for-time-tests`  |
| `core_ext/time_ext_test.rb`                         |    5 | `activesupport-time-ext-all-range-readers`             |
| `notifications_test.rb`                             |    4 | `activesupport-test-residual-singletons`               |
| `core_ext/enumerable_test.rb`                       |    3 | `activesupport-test-residual-singletons`               |
| `cache/behaviors/connection_pool_behavior.rb` (✗)   |    3 | `connection-pool-behavior-ts-twin`                     |
| `fetch race condition protection` (behavior + 2)    |    3 | `cache-store-behavior-fetch-race-condition-protection` |
| `hash_with_indifferent_access_test.rb`              |    2 | `activesupport-test-residual-singletons`               |
| `logger_test.rb` (`log at only impact receiver`)    |    1 | `logger-log-at-forks-isolated-execution-state`         |
| `option_merger_test.rb` (`implicit receiver`)       |    1 | `with-options-implicit-receiver-instance-eval-arm`     |
| `message_pack/serializer_test.rb` (`#signature?` …) |    1 | `port-message-pack-shared-tests-into-cache-serializer` |

The 52 inflector misses are all `define_method` loops (`inflector_test.rb:91-115`
over `SingularToPlural`, the `Irregularities` loop, and the `class_eval`'d
`test_clear_#{inflection_type}` at `:479`).

### Test gap: 56 Skip, and the structural rows

| Skips | Files                                                                                                                                                                                                                                                                                | Owner                                                                                    |
| ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
|     7 | `safe_buffer` 5, `ordered_hash` 2                                                                                                                                                                                                                                                    | `port-ordered-hash-and-safe-buffer-stubs`                                                |
|     6 | `time_travel` 5, `testing/constant_lookup` 1                                                                                                                                                                                                                                         | `time-travel-test-port-three-time-zone-cases`, `port-activesupport-testing-helper-stubs` |
|     9 | `message_encryptor` 2, `json_gem_encoding` 2, `pathname/{blank,existence}` 2, `message_verifier`, `reloader`, `kernel/concern`                                                                                                                                                       | `port-out-of-closure-activesupport-singleton-tail`                                       |
|     3 | `time_ext`                                                                                                                                                                                                                                                                           | `activesupport-time-ext-all-range-readers`                                               |
|     1 | `encoded_key_cache_behavior`                                                                                                                                                                                                                                                         | `port-cache-connection-pool-and-encoded-key-behaviors`                                   |
|    30 | `cache_store_setting` 6, `encrypted_configuration` 5, `cache_store_logger` 4, `proxy_wrappers` 3, `null_store` 2, `cache_entry` 2, `notifications` 2, and 1 each in `file_store`, `memory_store`, `cache_store_behavior`, `enumerable`, `log_subscriber`, `isolated_execution_state` | `activesupport-test-skip-receipts`                                                       |

`activesupport-test-skip-receipts` also owns the 5 wrong-describe rows in
`share_lock_test.rb`, the 4 assertion mismatches, and the ✗
`concurrency/load_interlock_aware_monitor_test.rb`. The ✗
`dependencies_test.rb` belongs to
`activesupport-api-dependencies-and-syntax-error-proxy`. The one misplaced
test (`hash`, in `time-with-zone.test.ts`) moves in
`activesupport-time-with-zone-methods-for-time-tests`.

The denominator also leaves out the 20 activesupport rows in
`scripts/parity/unported-files/activesupport.ts` and the 10 activesupport rows
in `scripts/parity/unported-files/baseline.json`. None of their reasons starts
with `PERMANENT:`. `activesupport-unported-files-permanence-audit` owns them.

### API gap: 127 missing methods

`--missing` shows that `callbacks.rb`'s 15 misses are not callbacks work.
Thirteen of them (`minimum`, `index_by`, `index_with`, `many?`, `including`,
`exclude?`, `excluding`, `without`, `pluck`, `pick`, `compact_blank`,
`in_order_of`, `sole`) are the `core_ext/enumerable.rb` methods. They are
scored twice because trails defines them away from `core-ext/enumerable.ts`.
Only `halted_lambda` and `default_terminator` belong to `callbacks.rb`.

| Ruby file(s)                                                               | Miss | Members                                                                                                                                    | Owner                                                       |
| -------------------------------------------------------------------------- | ---: | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `core_ext/enumerable.rb` + 13 of `callbacks.rb`                            |   27 | the 14 Enumerable methods, counted on both files                                                                                           | `relocate-core-ext-enumerable-rb-methods-and-converge-sole` |
| `callbacks.rb`                                                             |    2 | `halted_lambda`, `default_terminator`                                                                                                      | `activesupport-api-callbacks-residue`                       |
| `test_case.rb`                                                             |   14 | 12 `assert_not_*` / `assert_no_match` aliases, `inspect`, `test`                                                                           | `activesupport-api-test-case-and-time-helpers-residue`      |
| `testing/time_helpers.rb`                                                  |    6 | `Stub`'s `object`, `method_name`, `original_method` and writers                                                                            | `activesupport-api-test-case-and-time-helpers-residue`      |
| `dependencies.rb`, `dependencies/require_dependency.rb` (✗)                |   11 | `interlock`, `autoload_paths`, `autoload_once_paths`, `_eager_load_paths`, `_autoloaded_tracked_classes` (+ writers), `require_dependency` | `activesupport-api-dependencies-and-syntax-error-proxy`     |
| `syntax_error_proxy.rb`                                                    |    9 | `path`, `lineno`, `to_s` (+ writers), `initialize`, `spot`, `label`                                                                        | `activesupport-api-dependencies-and-syntax-error-proxy`     |
| `subscriber.rb`                                                            |    7 | `initialize`, `subscriber`, `notifier`, `namespace`, `find_attached_subscriber`, `prepare_pattern`, `pattern_subscribed?`                  | `activesupport-api-subscriber-and-output-safety-residue`    |
| `core_ext/string/output_safety.rb`                                         |    7 | `original_concat`, `encode_with`, `gsub`, `gsub!`, `sub`, `sub!`, `set_block_back_references`                                              | `activesupport-api-subscriber-and-output-safety-residue`    |
| `testing/parallelization{,/server,/worker}.rb` (✗ ×3)                      |    4 | `start` ×2, `name`, `name=`                                                                                                                | `activesupport-api-parallelization-permanence`              |
| `environment_inquirer.rb`, `core_ext/*`, `cache/*`, `backtrace_cleaner.rb` |   21 | see the story                                                                                                                              | `activesupport-api-singletons-core-ext-and-cache`           |
| 16 runtime and messages files                                              |   19 | see the story                                                                                                                              | `activesupport-api-singletons-runtime-and-messages`         |

Totals: 14 + 13 + 2 + 14 + 6 + 11 + 9 + 7 + 7 + 4 + 21 + 19 = 127.

### API structure

- **Misplaced (3):** `core_ext/date/acts_like.rb` is matched in
  `core-ext/date-and-time/calculations.ts`, and `deprecation/behaviors.rb` and
  `deprecation/reporting.rb` are matched in `deprecation.ts`.
- **Inheritance (13):** 11 rows are Ruby core-class reopens with no trails
  class (`Hash`, `Class`, `DateTime`, `Range`, `ERB`, `File`, `Integer`,
  `LoadError`, `NameError`, `Object`, `Data`). Two are real mismatches:
  `DescendantsTracker`'s `WeakSet < WeakMap` and NokogiriSAX's
  `HashBuilder < Nokogiri::XML::SAX::Document`.
- **Arity (4):** `cache.ts:_instrument` (keyword args flattened),
  `core-ext/array/extract.ts:extractBang` (block as a positional),
  `subscriber.ts:_addEventSubscriber` / `_removeEventSubscriber` (an extra
  `state` parameter).

All three lists are owned by
`activesupport-api-structure-misplaced-inheritance-arity`.

## Stories moved in

These were filed in other RFCs, are not done, and each closes a row above.
They are moved here with `git mv` and a rewritten `rfc:` line, the same
change `tasks rehome` makes. Ingest treats it as a rename, so each story keeps
its history.

| Story                                                         | From | Closes                                           |
| ------------------------------------------------------------- | ---- | ------------------------------------------------ |
| `port-message-pack-shared-tests-into-cache-serializer`        | 0101 | 23 test Miss                                     |
| `cache-store-behavior-fetch-race-condition-protection`        | 0101 | 3 test Miss                                      |
| `logger-log-at-forks-isolated-execution-state`                | 0101 | 1 test Miss                                      |
| `port-cache-connection-pool-and-encoded-key-behaviors`        | 0101 | connection-pool rows, 1 skip                     |
| `port-out-of-closure-activesupport-singleton-tail`            | 0101 | 9 skips                                          |
| `port-ordered-hash-and-safe-buffer-stubs`                     | 0101 | 7 skips                                          |
| `port-activesupport-testing-helper-stubs`                     | 0101 | `constant_lookup` and `time_travel` skips        |
| `delete-hwia-extended-test-file-json-gem-encoding-duplicates` | 0101 | the `json_gem_encoding` duplicates               |
| `with-options-implicit-receiver-instance-eval-arm`            | 0158 | 1 test Miss                                      |
| `relocate-core-ext-enumerable-rb-methods-and-converge-sole`   | 0158 | 27 API Miss                                      |
| `time-travel-test-port-three-time-zone-cases`                 | 0158 | 3 `time_travel` skips                            |
| `connection-pool-behavior-ts-twin`                            | 0158 | the ✗ `connection_pool_behavior.rb`, 3 test Miss |
| `active-support-test-parallelization-threshold-unseated`      | 0158 | the `test_parallelization_threshold` seat        |

Several of the moved stories have stub counts from an older reconciliation.
Each story's AC is "every stub in the file is implemented", so stale counts do
not change the scope. The tables above give the current counts.

## Prior art

- **RFC 0098** (closed) ported the AR require closure. The closure is now at
  95.8% for tests and 96.3% for the API.
- **RFC 0101** (draft) keeps the cache-store and XmlMini fidelity work that
  does not show up in a parity number.
- **RFC 0158** (active) keeps the assertion-surfaced port bugs that do not
  move a parity number.
- **RFC 0245** is the model for "100%" here.

## Design

### What "100%" means

- `parity:test`: Miss, Desc and Move are all 0, and no file is ✗. Every Skip
  has a `PERMANENT-SKIP:` line that cites a CLAUDE.md section by name.
- `parity:api`: Miss and misplaced are 0, and inheritance and arity are at
  100%. A row the tool cannot match because of a ratified limit (for example
  a core-class reopen) is receipted in the tool's skip list with a
  `PERMANENT:` reason.
- Every activesupport row in `unported-files/activesupport.ts`, every
  activesupport scoped skip, and every activesupport row in `baseline.json`
  has a reason that starts with `PERMANENT:` and cites a section.

`activesupport-parity-100-gate` enforces all three in CI.

### Permanence candidates

| Gap                                                    | Section (trails `CLAUDE.md`)                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------- |
| `multibyte_chars_test.rb` bang methods (14)            | "Ruby Strings are JS string primitives (no mutable String carrier)"       |
| The 11 core-class inheritance rows                     | "Core extensions are not installed on native prototypes"                  |
| `testing/parallelization*` (4 API)                     | "Runtime facts Node does not expose", the `fork` bullet                   |
| `dependencies.rb` autoload hooks, `require_dependency` | "`Module#autoload` is a build step"; "The application loader is Zeitwerk" |
| `json_gem_encoding_test.rb` (2 skips)                  | none yet: Open question 4                                                 |
| `pathname/{blank,existence}_test.rb` (2 skips)         | none yet: Open question 4                                                 |

Each owning story applies the section named, or ports the gap if the operator
rules that the section does not apply.

### Story sizing

Each story is one trails PR under the 500 LOC ceiling. When a story ports
tests and one fails, the fix goes in `packages/activesupport/lib`. The test is
never renamed or skipped to get it to pass. The same PR retires the matching
unported-files rows.

## Non-goals

- **Fidelity bugs that do not move a parity number.** They stay in 0101 and 0158.
- **New cache backends.** Redis and Memcache stay out under the
  `SOLID_STACK_ONLY` ruling. This RFC only rewords their rows to `PERMANENT:`.
- **The 252 extra (TS-only) tests.** Extra tests do not lower parity.

## Alternatives considered

- **Leaving the 13 stories in 0101 and 0158 as cross-RFC deps.** Rejected.
  0101 is draft, so 0246 would be blocked on another RFC's activation, and no
  single place would show the work left to 100%.
- **Folding all of RFC 0101 in.** Rejected. Most of 0101's 102 stories are
  fidelity work that does not show up in either parity number.

## Rollout

1. **Phase 1, test misses:** inflector loops, the safe-buffer loop,
   time-with-zone (which also moves the misplaced `hash` test), time-ext,
   residual singletons, the message-pack cache serializer, connection pool
   (both stories), fetch race, logger `log_at` and option merger.
2. **Phase 2, API misses:** the Enumerable relocation first, because it
   clears 27 misses on two files. Then callbacks, test-case and time helpers,
   subscriber and output safety, and the two singleton stories.
3. **Phase 3, skips and receipts:** the three moved stub-burndown stories, the
   time-travel zone cases, multibyte bang methods, parallelization (with the
   threshold seat), dependencies and the syntax-error proxy, skip receipts
   (which also fixes the `share_lock` wrong describes and the assertion
   mismatches), and the unported-files permanence audit.
4. **Phase 4, API structure:** misplaced files, inheritance and arity. Then
   `activesupport-parity-100-gate`.

## Verification

- `pnpm parity:test -- --package activesupport`: Miss, Desc and Move are 0, no
  file is ✗, and every Skip carries `PERMANENT-SKIP:`.
- `pnpm parity:api -- --package activesupport` on a clean build: Miss and
  misplaced are 0, and inheritance and arity are at 100%.
- Every activesupport row in `scripts/parity/unported-files/activesupport.ts`
  and `scripts/parity/unported-files/baseline.json` has a reason that starts
  with `PERMANENT:`.
- The gate story's CI check passes on main.

## Open questions

1. **Does `SafeBuffer` port its `#{method}!` arms?** `Multibyte::Chars` bang
   methods mutate the wrapped Ruby String, so they fall under "Ruby Strings
   are JS string primitives". `SafeBuffer` is a trails class that holds its
   own value. Recommendation: port its 22 bang arms, which only need to drop
   `html_safe?`.
2. **Is `testing/parallelization` permanent under the `fork` bullet?** Rails'
   executor forks workers and talks to them over DRb. Recommendation: yes.
   vitest owns worker scheduling, and a DRb-shaped server and worker pair
   would be an invented mechanism. `test_parallelization_threshold` still
   gets its seat on `ActiveSupport`.
3. **How much of `Dependencies` is permanent?** Recommendation: the autoload
   path accessors and `require_dependency` fall under "`Module#autoload` is a
   build step". `interlock` / `interlock=` port, because the load interlock
   exists in trails (`packages/activesupport/CLAUDE.md` § "A thread-owned lock
   is owned by the Fiber").
4. **Are the JSON-gem and Pathname skips permanent?** No section covers them.
   `json_gem_encoding_test.rb` exercises the `json` gem's generator, and the
   `pathname/*` tests need Ruby's `Pathname`, which trails does not port.
   Recommendation: the operator ratifies a section for unported Ruby stdlib
   classes, and `port-out-of-closure-activesupport-singleton-tail` cites it.
   Until then, that story ports its other 5 skips and leaves these 4 skips
   alone.
5. **Should the 140 defs in excluded files count?** Recommendation: they
   count until their file row reads `PERMANENT:`. The permanence audit makes
   that call.

## Changelog

- 2026-11-18: initial RFC
- 2026-11-18: review fixes and re-measure on a clean build (same totals). The
  gate now enforces the full definition of 100%. Thirteen 0101 / 0158 stories
  that move a parity number are moved here. The `callbacks.rb` misses are
  re-attributed to Enumerable, the API singletons are split into two stories
  with real member lists, every permanence candidate names a real section or
  an open question, and the Rollout matches story ownership. The baseline
  re-measure story is dropped because this revision is the re-measure.
- 2026-11-20: four stories added from RFC `0000-last-mile-parity`:
  `activesupport-api-format-version-compact-blank-rescue-handlers`,
  `null-store-prepends-local-cache`, `notifications-tests-port-all-but-allocations`,
  `json-gem-encoding-and-pathname-blank-tests`.
