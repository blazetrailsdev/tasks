---
title: "Reconcile the out-of-closure activesupport test remainder against RFC 0101"
status: claimed
updated: 2026-08-31
rfc: "0105-ar-deps-test-parity-100"
cluster: name-gap
packages:
  - "activesupport"
deps:
  - "derive-ar-closure-test-manifest"
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: "2026-08-31T20:57:54Z"
assignee: "reconcile-out-of-closure-activesupport-test-remainder"
blocked-by: null
closed-reason: null
---

## Context

91 activesupport test files (1,072 Rails tests) fall outside the AR require
closure, and 201 of their tests remain. This RFC does **not** exclude them — 871
of those 1,072 are already matched, so an exclusion would delete earned work to
buy a 201-test denominator cut — but it also does not own their porting.

Most are already owned: ~125 are cache behaviors under RFC 0101
`activesupport-out-of-closure-surface`, which carries
`enroll-cache-store-compression-behavior`,
`wire-cache-logging-behavior-into-helpers`,
`wire-cache-store-version-behavior-into-helpers`,
`wire-cache-store-format-version-behavior-into-helpers`,
`wire-the-remaining-cache-behavior-modules-into-helpers`,
`port-the-remaining-cache-store-behavior-cases` and
`relocate-misplaced-cache-behavior-cases-into-helpers`. The largest single
counts: `cache/behaviors/cache_store_behavior.rb` 42 missing,
`local_cache_behavior.rb` 29 stubs, `failure_safety_behavior.rb` 13,
`cache_store_version_behavior.rb` 12, `failure_raising_behavior.rb` 12,
`cache_logging_behavior.rb` 8, `cache_store_format_version_behavior.rb` 8,
`cache/serializer_with_fallback_test.rb` 5, `connection_pool_behavior.rb` 3,
`encoded_key_cache_behavior.rb` 2.

The remaining ~76 are scattered (`ordered_hash_test.rb` 8 stubs,
`safe_buffer_test.rb` 7, `testing/constant_lookup_test.rb` 5,
`rescuable_test.rb` 4 missing, `time_travel_test.rb` 4,
`core_ext/module/attribute_accessor_per_thread_test.rb` 4,
`cache/cache_store_logger_test.rb` 4, `tagged_logging_test.rb` 3,
`isolated_execution_state_test.rb` 3, `testing/file_fixtures_test.rb` 3, and a
long tail of 1–2s) and several have no owner at all.

## Acceptance criteria

- A file-by-file reconciliation of the 201 against RFC 0101's story list: owned
  (which story), or unowned.
- Every unowned file is filed as a story **against RFC 0101** with
  `pnpm tasks new 0101-activesupport-out-of-closure-surface <slug> --body-file …`,
  carrying the counts and the Rails/trails `file:line` — not filed here, and not
  left as a note.
- No `unported-files` rows are added for any of them.
- Analysis + story filing only; no source changes.
