---
title: "activerecord: the 9 CONVERGEABLE test-infrastructure receipts (test-adapter, sql-capture, fixtures)"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: receipts
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

CLAUDE.md admits two receipt shapes, `PERMANENT` and `CONVERGEABLE <story-id>`. These receipts say
`CONVERGEABLE` and then carry prose instead of a story id, so nothing tracks them
(`name-stories-for-activerecord-malformed-deviation-receipts`, RFC 0127, counts 92 such sites repo-wide;
`convergeable-tag-story-id`, RFC 0120, makes the shape an error). This story is the convergence the
prose promises, for:

- `test-adapter.ts:34` `@noRailsEquivalent` — CONVERGEABLE reads connection_pool.db_config.configuration_hash the way the Rails pool test does (test/cases/connection_pool_test.rb:16-30).
- `test-adapter.ts:48` `@noRailsEquivalent` — CONVERGEABLE the same configuration hash with the one-connection caps that test applies (test/cases/connection_pool_test.rb:16-30).
- `test-adapter.ts:95` `@noRailsEquivalent` — CONVERGEABLE the lease_connection setup of the Rails pool test (test/cases/connection_pool_test.rb:16-30), which Ruby writes inline per test.
- `test-adapter.ts:173` `@noRailsEquivalent` — CONVERGEABLE the duplicate-pool setup of the Rails pool test (test/cases/connection_pool_test.rb:16-30), memoized per file.
- `test-fixtures.ts:173` `@noRailsEquivalent` — CONVERGEABLE FixtureSet.create_fixtures' name-to-model resolution (fixtures.rb:595), async because model classes load by dynamic import.
- `test-fixtures/with-transactional-fixtures.ts:58` `@noRailsEquivalent` — CONVERGEABLE the eager schema warm Ruby gets free from lazy synchronous load_schema (model_schema.rb:587).
- `testing/sql-capture.ts:47` `@noRailsEquivalent` — CONVERGEABLE ActiveRecord::TestCase#capture_sql (test/cases/test_case.rb:90), async because the block it wraps is.
- `testing/sql-capture.ts:77` `@noRailsEquivalent` — CONVERGEABLE ActiveRecord::TestCase#capture_sql_and_binds (test/cases/test_case.rb:102), async because the block it wraps is.
- `testing/sql-capture.ts:98` `@noRailsEquivalent` — CONVERGEABLE the capture_log_output helper of the Rails insert-all test (test/cases/insert_all_test.rb:849).

Rails writes these inline per test (`vendor/rails/v8.0.2/activerecord/test/cases/connection_pool_test.rb:16-30`, test_case.rb:90,102, insert_all_test.rb:849) or in `TestFixtures`; trails hoisted them into shared helpers.

## Acceptance criteria

- [ ] Each of the 9 declarations converges onto the Rails shape its receipt names (the helper folded back into the Rails method, the slot read through the Rails accessor, the method renamed to Rails' name), and the receipt is deleted with it.
- [ ] Where one site genuinely cannot converge in this story, it is filed as its own story in this RFC and its receipt re-tagged `CONVERGEABLE <that-story>` — never left as prose, never PERMANENT.
- [ ] `pnpm parity:api:extra:gate` stays rowless; `:calls` and `:calls:args` green.
