---
title: "Triage activesupport's 291 skip stubs into port-or-exclude dispositions"
status: done
updated: 2026-09-02
rfc: "0105-ar-deps-test-parity-100"
cluster: name-gap
packages:
  - "activesupport"
deps:
  - "derive-ar-closure-test-manifest"
deps-rfc: []
est-loc: 280
priority: null
pr: 7369
claim: "2026-09-02T00:41:22Z"
assignee: "triage-activesupport-in-closure-skip-stubs"
blocked-by: null
closed-reason: null
---

## Context

activesupport's 451 remaining tests are **291 `it.skip`/`todo` stubs** and 160
genuinely absent tests (measured 2026-08-13). A stub is not a pass —
`scripts/test-compare/compare.ts:694-695` increments `matchedSkipped` and
`compare.ts:894-895` subtracts it — but it is a different kind of work from a
missing test: the file exists and holds the Rails name verbatim, so the question
is only whether the case can run in TypeScript.

Many plainly cannot, and those must become reasoned case-level `tests:`
exclusions rather than ports. The concentrations, in-closure by the manifest
from `derive-ar-closure-test-manifest`:

- `core_ext/hash_ext_test.rb` — 44 stubs (of 93 Rails tests)
- `share_lock_test.rb` — 25 (thread/monitor semantics)
- `core_ext/date_and_time_compatibility_test.rb` — 21
- `core_ext/string_ext_test.rb` — 15, `core_ext/array/conversions_test.rb` — 12
- `json/encoding_test.rb` — 11, `dependencies_test.rb` — 10
- `core_ext/time_ext_test.rb` — 6, `core_ext/date_ext_test.rb` — 5,
  `core_ext/date_time_ext_test.rb` — 5, `core_ext/class/attribute_test.rb` — 5,
  `inflector_test.rb` — 4, `concurrency/load_interlock_aware_monitor_test.rb` — 3
- plus ~35 across smaller in-closure files

Out-of-closure stubs (91) are not in this story's scope — they belong with RFC
0101's cache/XmlMini enrollment work.

## Acceptance criteria

- Every in-closure skip stub has a written disposition: **port** (which of the
  porting stories takes it) or **exclude** (a case-level `tests:` entry with a
  reason naming the specific Ruby-only mechanism — threads, `Marshal`, `Ractor`,
  `ObjectSpace`, fork).
- The exclusion dispositions are landed as case-level entries in this PR; the
  reasons are specific enough that a reviewer can check them against the Rails
  test body.
- The port dispositions are reflected by editing the porting stories below
  (`pnpm tasks edit`), so their scopes are real rather than estimated.
- The PR body states the resulting in-closure remaining count and how it splits
  port vs exclude.

## Triage (2026-09-01)

Re-measured with `pnpm parity:test -- --package activesupport --json`,
partitioned by `scripts/test-compare/closure-manifest.ts`. The story's
2026-08-13 figure of **291** in-closure stubs is stale: sibling RFC 0105/0098
work has since burnt it to **160 matched-skipped** across 22 in-closure files
(162 `it.skip` stub names — `inflector_test.rb`'s `constantize` and
`safe constantize` are stubbed in TS but score `missing`, not `matchedSkipped`).
`core_ext/date_and_time_compatibility_test.rb`'s 21 are now out-of-closure and
owned by `port-date-and-time-compatibility-and-zone-cases`;
`cache/behaviors/local_cache_behavior.rb`'s 29 are out-of-closure under RFC 0101.

The 162 split **81 exclude / 81 port**.

### Exclude — landed as case-level `tests:` rows in this PR (81)

All in `scripts/parity/unported-files/activesupport.ts`; the TS stubs were
deleted so the excluded cases do not resurface as `extra`. Five files lost
every case and so lost their whole TS file (`share-lock.test.ts`,
`dependencies.test.ts`, `autoload.test.ts`, `multibyte-proxy.test.ts`,
`concurrency/load-interlock-aware-monitor.test.ts`).

| Rails test file                                         | n   | Ruby-only mechanism                                                                                                  |
| ------------------------------------------------------- | --- | -------------------------------------------------------------------------------------------------------------------- |
| `share_lock_test.rb`                                    | 25  | `Thread.new` + Monitor/ConditionVariable blocking, `Thread#kill`                                                     |
| `json/encoding_test.rb`                                 | 10  | `Process::Status` via a child process, Encoding transcode, `Struct`, `Data`, the `json` gem's `to_json(state)`, `IO` |
| `dependencies_test.rb`                                  | 10  | `require_dependency` → `Kernel#require` against `$LOAD_PATH`                                                         |
| `autoload_test.rb`                                      | 6   | `Module#autoload` / `autoload?`                                                                                      |
| `transliterate_test.rb`                                 | 5   | non-UTF-8 Ruby `Encoding` and invalid byte sequences                                                                 |
| `core_ext/time_with_zone_test.rb`                       | 4   | Psych `!ruby/object:` round-trip                                                                                     |
| `core_ext/class/attribute_test.rb`                      | 4   | per-object singleton class, `Module#prepend`                                                                         |
| `core_ext/module/attribute_accessor_per_thread_test.rb` | 4   | `Thread` / `Fiber` isolation                                                                                         |
| `time_zone_test.rb`                                     | 3   | Psych (2), `Time.new(…, in: zone)` zone slot (1)                                                                     |
| `concurrency/load_interlock_aware_monitor_test.rb`      | 3   | GVL hand-off from a contending `Thread`                                                                              |
| `inflector_test.rb`                                     | 2   | `Object.const_get` over a nested constant path                                                                       |
| `core_ext/string_ext_test.rb`                           | 1   | Psych `to_yaml`                                                                                                      |
| `core_ext/module/attribute_accessor_test.rb`            | 1   | `class << klass` body + Ruby class variables                                                                         |
| `descendants_tracker_test.rb`                           | 1   | Ruby GC collecting a class, observed from a `Thread`                                                                 |
| `multibyte_proxy_test.rb`                               | 1   | `Multibyte.proxy_class` / `String#mb_chars`                                                                          |
| `core_ext/object/inclusion_test.rb`                     | 1   | `Module#include?` ancestry                                                                                           |

### Port — owned by the RFC 0105 porting stories (81)

| Rails test file                      | n   | owner                                                |
| ------------------------------------ | --- | ---------------------------------------------------- |
| `core_ext/hash_ext_test.rb`          | 43  | `port-core-ext-hash-ext-remaining-cases`             |
| `core_ext/array/conversions_test.rb` | 12  | `port-core-ext-string-array-and-json-cases`          |
| `core_ext/string_ext_test.rb`        | 4   | `port-core-ext-string-array-and-json-cases`          |
| `json/encoding_test.rb`              | 1   | `port-core-ext-string-array-and-json-cases`          |
| `core_ext/time_ext_test.rb`          | 4   | `port-core-ext-numeric-and-time-ext-cases`           |
| `core_ext/date_ext_test.rb`          | 4   | `port-date-and-time-compatibility-and-zone-cases`    |
| `core_ext/time_with_zone_test.rb`    | 3   | `port-date-and-time-compatibility-and-zone-cases`    |
| `time_zone_test.rb`                  | 2   | `port-date-and-time-compatibility-and-zone-cases`    |
| `inflector_test.rb`                  | 4   | `port-inflector-dependencies-and-in-closure-residue` |
| `core_ext/range_ext_test.rb`         | 2   | `port-inflector-dependencies-and-in-closure-residue` |
| `core_ext/object/inclusion_test.rb`  | 1   | `port-inflector-dependencies-and-in-closure-residue` |
| `deep_mergeable_test.rb`             | 1   | `port-inflector-dependencies-and-in-closure-residue` |

`core_ext/hash_ext_test.rb`'s 43 and `core_ext/array/conversions_test.rb`'s 12
are all `to_xml`/`from_xml`; `packages/activesupport/src/xml-mini.ts` is ported,
so they are ports rather than exclusions — what is missing is
`core_ext/hash/conversions.rb`, not the XML backend.

### Result

In-closure after this PR: **1,721 Rails tests, 1,673 matched, 81 still stubbed,
48 missing — 92.5%** (was 1,802 / 1,754 / 160 / 48 — 88.5%). The 81 remaining
stubs are all ports, distributed across the five stories above.
