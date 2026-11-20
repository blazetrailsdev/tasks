---
title: "port-activesupport-testing-helper-stubs"
status: done
updated: 2026-11-20
rfc: "0246-activesupport-parity-100"
cluster: null
packages: [scripts]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#10386
claim: "2026-11-19T23:05:59Z"
assignee: "port-activesupport-testing-helper-stubs"
blocked-by: null
closed-reason: null
---

## Context

From the RFC 0105 reconciliation
(`reconcile-out-of-closure-activesupport-test-remainder`). The
`ActiveSupport::Testing::*` out-of-closure remainder, unowned:

- `vendor/rails/activesupport/test/testing/constant_lookup_test.rb:5`
  (`class MyTestCase`/`ConstantLookupTest`, 71 lines) — **5 stubs**
  (`ActiveSupport::Testing::ConstantLookup#determine_constant_from_test_name`).
- `vendor/rails/activesupport/test/time_travel_test.rb:9`
  (`class TimeTravelTest`, 505 lines) — **4 stubs**
  (`ActiveSupport::Testing::TimeHelpers` — `travel`, `travel_to`,
  `freeze_time`, `travel_back`).
- `vendor/rails/activesupport/test/testing/file_fixtures_test.rb:7`
  (`class FileFixturesTest`, 32 lines) — **3 stubs**
  (`ActiveSupport::Testing::FileFixtures#file_fixture`).

## Acceptance criteria

- All 12 stubs implemented; none left `it.skip`.
- Rails test names verbatim.
- `pnpm parity:test` deltas non-negative.
