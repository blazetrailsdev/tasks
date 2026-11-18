---
rfc: "0246-activesupport-parity-100"
title: "activesupport: 100% API and test parity"
status: draft
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
priority: null
---

# RFC 0246 — activesupport: 100% API and test parity

## Summary

Bring `packages/activesupport` to 100% on both `pnpm parity:api` and
`pnpm parity:test`. Every Rails public method needs a matched trails member,
and every Rails test needs a name-matched trails test. The only exception is
something that is permanently unportable under a ratified CLAUDE.md section
and carries the receipt that section prescribes. Today activesupport is at
**94.5% API (2162/2289)** and **93.9% tests (3481/3706)**. This RFC is the
umbrella. It defines what "100%" means, reuses the open stories in RFCs 0101
and 0158 that already cover part of the gap, and files stories for the rest.

## Motivation

Measured on 2026-11-18 at trails `4d6bf61e04`:

```text
pnpm parity:test -- --package activesupport
activesupport — 3481/3706 tests (93.9%) (56 skipped, 5 wrong describe,
  1 assertion-count-mismatch, 3 assertion-kind-mismatch, 252 extra)
  | 164/167 files | 1 misplaced
  AR closure: 2058/2148 (95.8%) | out of closure: 1423/1558 (91.3%)

API_COMPARE_ALLOW_STALE_BUILD=1 pnpm parity:api -- --package activesupport
activesupport — 2162/2289 methods (94.5%) | files: 213/218 | 3 misplaced
  | inheritance: 87/100 (87%) | arity: 1487/1491 (99.7%) | params: 913/913
  Ruby defs: 2544 — own row 2000 | excluded file 140 | rowless file 22
  | global skip 48 | scoped skip 54 | operator 56 | same-name collapse 224
```

The API run used `API_COMPARE_ALLOW_STALE_BUILD=1` against a `dist/` that had
not been rebuilt, so its totals are only indicative.
`activesupport-parity-baseline-remeasure` takes both numbers again on a clean
build before any other story starts.

### Test gap: 168 Miss, 56 Skip

| Ruby test file                                      | Miss | Owner                                                         |
| --------------------------------------------------- | ---: | ------------------------------------------------------------- |
| `inflector_test.rb`                                 |   52 | `activesupport-inflector-test-loop-residue` (new)             |
| `safe_buffer_test.rb`                               |   44 | `activesupport-safe-buffer-unsafe-method-loop` (new)          |
| `message_pack/cache_serializer_test.rb`             |   22 | `port-message-pack-shared-tests-into-cache-serializer` (0101) |
| `multibyte_chars_test.rb`                           |   14 | `activesupport-multibyte-chars-bang-methods` (new)            |
| `core_ext/time_with_zone_test.rb`                   |   13 | `activesupport-time-with-zone-methods-for-time-tests` (new)   |
| `core_ext/time_ext_test.rb`                         |    5 | `activesupport-time-ext-all-range-readers` (new)              |
| `notifications_test.rb`                             |    4 | `activesupport-test-residual-singletons` (new)                |
| `core_ext/enumerable_test.rb`                       |    3 | `activesupport-test-residual-singletons` (new)                |
| `cache/behaviors/connection_pool_behavior.rb`       |    3 | `port-cache-connection-pool-and-encoded-key-behaviors` (0101) |
| fetch race condition (behavior + file/memory store) |    3 | `cache-store-behavior-fetch-race-condition-protection` (0101) |
| `hash_with_indifferent_access_test.rb`              |    2 | `activesupport-test-residual-singletons` (new)                |
| `logger_test.rb` (`log at only impact receiver`)    |    1 | `logger-log-at-forks-isolated-execution-state` (0101)         |
| `option_merger_test.rb` (implicit receiver)         |    1 | `with-options-implicit-receiver-instance-eval-arm` (0158)     |
| `message_pack/serializer_test.rb` (`#signature?`)   |    1 | `port-message-pack-shared-tests-into-cache-serializer` (0101) |

The test gap also includes:

- 56 `it.skip`s across 28 files. The largest are `cache_store_setting` (6),
  then `safe_buffer`, `time_travel` and `encrypted_configuration` (5 each).
- 5 wrong-describe rows in `share_lock_test.rb`.
- 1 misplaced test (`time-with-zone.test.ts` → `core-ext/time-with-zone.test.ts`).
- 4 assertion mismatches.
- Three ✗ files with no runnable match: `connection_pool_behavior.rb`,
  `concurrency/load_interlock_aware_monitor_test.rb` and
  `dependencies_test.rb`.

The denominator also leaves out the 20 activesupport rows in
`scripts/parity/unported-files/activesupport.ts` and the 10 activesupport rows
in `baseline.json`. Most of them already have a ruling, such as
`SOLID_STACK_ONLY` for the Redis and Memcache stores. None of them starts with
a `PERMANENT:` reason that cites a section.
`activesupport-unported-files-permanence-audit` audits them.

### API gap: 127 missing methods

| Ruby file                                               | Miss | Owner                                                              |
| ------------------------------------------------------- | ---: | ------------------------------------------------------------------ |
| `callbacks.rb`                                          |   15 | `activesupport-api-callbacks-residue` (new)                        |
| `core_ext/enumerable.rb`                                |   14 | `relocate-core-ext-enumerable-rb-methods-and-converge-sole` (0158) |
| `test_case.rb`                                          |   14 | `activesupport-api-test-case-and-time-helpers-residue` (new)       |
| `dependencies.rb`, `dependencies/require_dependency.rb` |   11 | `activesupport-api-dependencies-and-syntax-error-proxy` (new)      |
| `syntax_error_proxy.rb`                                 |    9 | `activesupport-api-dependencies-and-syntax-error-proxy` (new)      |
| `subscriber.rb`                                         |    7 | `activesupport-api-subscriber-and-output-safety-residue` (new)     |
| `core_ext/string/output_safety.rb`                      |    7 | `activesupport-api-subscriber-and-output-safety-residue` (new)     |
| `testing/time_helpers.rb`                               |    6 | `activesupport-api-test-case-and-time-helpers-residue` (new)       |
| `testing/parallelization{,/server,/worker}.rb`          |    4 | `activesupport-api-parallelization-permanence` (new)               |
| `environment_inquirer.rb`                               |    4 | `port-out-of-closure-activesupport-singleton-tail` (0101)          |
| 26 other files with 1–3 misses each                     |   36 | `port-out-of-closure-activesupport-singleton-tail` (0101)          |

The API gap also includes 13 inheritance mismatches (87/100), 4 arity
mismatches, 3 misplaced files, 180 unpinned bodies, and the 140 defs in
excluded files.

## Prior art (reused, not duplicated)

- **RFC 0098** (closed) ported the AR require closure. The closure is now at
  95.8% for tests and 96.3% for the API. What remains of it is in the tables
  above.
- **RFC 0101** (draft) owns the out-of-closure surface, mainly the cache
  stores and XmlMini. Its 102 stories stay where they are. Six of them close
  rows in this RFC's tables. They are listed as deps of this RFC's stories,
  not filed again.
- **RFC 0158** (active) owns port bugs that assertion convergence surfaced.
  It is fidelity work, and most of it moves neither percentage. Two of its
  stories close rows here.
- **RFC 0245** is the model for "100%" here: Miss = 0, and every Skip carries a
  `PERMANENT-SKIP:` line that cites a ratified section.

## Design

### What "100%" means

- `parity:test`: Miss, Desc and Move are all 0, and no file is ✗. Every Skip
  has a `PERMANENT-SKIP:` line that cites a CLAUDE.md section by name.
- `parity:api`: Miss and misplaced are 0, and inheritance and arity are at
  100%. Every excluded-file and scoped-skip row carries a `PERMANENT:` reason
  that cites a ratified section.
- `unported-files/activesupport.ts` and the activesupport `baseline.json`
  rows contain only `PERMANENT:` rows.

### Permanence candidates

The gaps below look like ratified limits but have no receipt yet. Each owning
story either ports the tests or parks them under the section named. Where no
section fits yet, the story asks the operator to rule (see Open questions).

| Gap                                                    | Candidate section                                                    |
| ------------------------------------------------------ | -------------------------------------------------------------------- |
| `multibyte_chars_test.rb` bang methods (14)            | "Ruby Strings are JS string primitives" (in-place mutation)          |
| `safe_buffer_test.rb` `#{method}!` arms (22 of the 44) | same                                                                 |
| `testing/parallelization*` (4 API)                     | "Runtime facts Node does not expose" (fork / DRb), or vitest workers |
| `dependencies.rb` / `require_dependency.rb` (11 API)   | zeitwerk build-time autoloading (RFC 0213)                           |
| `json_gem_encoding_test.rb` (2 skips)                  | the JSON gem is not ported                                           |
| `pathname/{blank,existence}_test.rb` (2 skips)         | Pathname is not ported (trails paths are strings)                    |

### Story sizing

Each story is one trails PR under the 500 LOC ceiling. When a story ports
tests and one fails, the fix goes in `packages/activesupport/lib`. The test is
never renamed or skipped to get it to pass. The same PR retires the matching
unported-files rows.

## Non-goals

- **RFC 0158 fidelity bugs that do not move a parity number.** They stay in 0158.
- **New cache backends.** Redis and Memcache stay out under the
  `SOLID_STACK_ONLY` ruling. This RFC only rewords their rows to `PERMANENT:`.
- **The 252 extra (TS-only) tests.** Extra tests do not lower parity, and
  folding them in is RFC 0158 work.

## Alternatives considered

- **Filing the 0101 and 0158 stories again here.** Rejected for the same
  reason as in RFC 0245: story ids are global and already carry their
  context. They are deps instead.
- **Folding RFC 0101 into this one.** Rejected. 0101 has 102 stories, and most
  of them are fidelity work that does not show up in the parity numbers. Once
  this RFC is active, the operator may `rehome` the six overlapping stories.

## Rollout

1. **Phase 0, baseline:** `activesupport-parity-baseline-remeasure`.
2. **Phase 1, test residue (new stories):** inflector loops, the safe-buffer
   loop, time-with-zone, time-ext and the residual singletons. The 0101 and
   0158 deps run in parallel: the message-pack cache serializer, connection
   pool, fetch race, logger `log_at` and option merger.
3. **Phase 2, API residue (new stories):** callbacks, test-case and time
   helpers, and subscriber and output safety. The 0101 singleton tail and
   the 0158 enumerable relocation run alongside.
4. **Phase 3, receipts:** multibyte bang methods, parallelization,
   dependencies and the syntax-error proxy, skip receipts, and the
   unported-files permanence audit.
5. **Phase 4, structure:** clean up misplaced files, wrong describes,
   inheritance and arity. Then `activesupport-parity-100-gate` adds a CI
   ratchet so activesupport cannot drop below 100% again.

## Verification

- `pnpm parity:test -- --package activesupport`: Miss, Desc and Move are 0, no
  file is ✗, and every Skip carries `PERMANENT-SKIP:`.
- `pnpm parity:api -- --package activesupport` on a clean build: Miss and
  misplaced are 0, and inheritance and arity are at 100%.
- Every activesupport row in `scripts/parity/unported-files/activesupport.ts`
  has a reason that starts with `PERMANENT:`.

## Open questions

1. **Does in-place String mutation fall under "Ruby Strings are JS string
   primitives"?** The answer decides the 14 multibyte bang tests and 22 of
   the safe-buffer tests. Recommendation: yes for the `Multibyte::Chars` bang
   methods, because they mutate the wrapped String. `SafeBuffer` is a trails
   class, so its `#{method}!` arms should be ported, and they only lose
   `html_safe?`.
2. **Should `testing/parallelization` be ported onto vitest workers, or ruled
   permanent?** Recommendation: permanent. vitest owns worker scheduling, and
   a DRb-shaped server and worker pair would be an invented mechanism.
3. **Does zeitwerk's build-time loader (RFC 0213) make the remaining 10
   members of `dependencies.rb` permanent?** Recommendation: yes for the
   autoload hooks. The `interlock` readers should be ported.
4. **Should the 140 defs in excluded files count?** Recommendation: they
   count until their file row reads `PERMANENT:`. The permanence audit makes
   that call.

## Changelog

- 2026-11-18: initial RFC
