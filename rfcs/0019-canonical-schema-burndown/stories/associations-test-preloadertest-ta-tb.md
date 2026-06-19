---
title: "associations-test-preloadertest-ta-tb"
status: claimed
updated: 2026-06-19
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-19T02:24:26Z"
assignee: "associations-test-preloadertest-ta-tb"
blocked-by: null
---

## Context

`packages/activerecord/src/associations.test.ts` PreloaderTest. Two tests use bespoke essay-join tables that cannot use canonical `essays` because `essays.author_id` and `essays.category_id` are varchar columns in the canonical schema, while these tests use integer FKs (which would break on PG due to type mismatch):

- "preload with available records with through association" (ta_authors, ta_categories, ta_essays)
- "preload with only some records available with through associations" (tb_authors, tb_categories, tb_essays)

These test the preloader's `availableRecords` handling for through associations (Author → essays → categories).

Rails source: `vendor/rails/activerecord/test/cases/associations_test.rb` PreloaderTest ~test_preload_with_available_records_with_through_association.

## Acceptance criteria

Option A: Convert canonical `essays` to use integer `author_id`/`category_id` if Rails schema.rb uses integers, then convert TA/TB tests.
Option B: Identify another canonical join table pattern (e.g. categories_posts with post as "essay") and remap the tests.
Option C: Keep bespoke tables and accept that TA/TB cannot be canonical (document why).

- If converted: ta*\*/tb*\* removed from defineSchema and `associations.test.ts` can be removed from `eslint/require-canonical-schema-exclude.json` (after wave 3 is also done).
- `test:compare` delta non-negative
