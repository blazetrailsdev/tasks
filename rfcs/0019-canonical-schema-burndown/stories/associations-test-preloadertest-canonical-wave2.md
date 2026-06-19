---
title: "PreloaderTest wave 2+ — convert remaining ~42 bespoke tests to canonical"
status: done
updated: 2026-06-19
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: 3620
claim: "2026-06-19T01:32:16Z"
assignee: "associations-test-preloadertest-canonical-wave2"
blocked-by: null
---

## Context

`packages/activerecord/src/associations.test.ts` PreloaderTest describe block has ~49 tests total. PR #3603 converted tests 1–7 (wave 1). The remaining ~42 tests (lines ~789+ on main after merge) still use bespoke inline models and tables (`GQS*`, `GQL*`, `GMM*`, `GAS*`, etc.) that are grandfathered in `eslint/require-canonical-schema-exclude.json`.

Rails source: `vendor/rails/activerecord/test/cases/associations_test.rb` PreloaderTest (lines ~860–1100+).

## Acceptance criteria

- All remaining PreloaderTest tests converted to canonical models (Author, Post, Comment, Book, Category, CategoryPost, Tag, Tagging, etc.)
- Bespoke table entries for `GQS*`, `GQL*`, `GMM*`, `GAS*`, `GQN*`, `GPQN*`, etc. removed from `defineSchema` block
- `associations.test.ts` removed from `eslint/require-canonical-schema-exclude.json`
- `test:compare` delta non-negative
- 500 LOC ceiling: split into additional waves if needed
