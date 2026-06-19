---
title: "Canonicalize NestedAttributesTest top block (bespoke per-test class pairs, lines 202-564)"
status: claimed
updated: 2026-06-19
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: "2026-06-19T14:12:26Z"
assignee: "canonicalize-nested-top-block"
blocked-by: null
---

## Context

`packages/activerecord/src/nested-attributes.test.ts` lines 202–564: `NestedAttributesTest`. Each test creates a unique bespoke class pair (NTag0/NPirate0, NComment5/NPost5, NTag6/NArticle6, NTag7/NArticle7, etc.) with unique prefixed table names to avoid cross-test collisions. There are ~12 tests, each with 2 bespoke classes = ~24 table pairs in TEST_SCHEMA (n_pirate0s, n_tag0s, n_comment5s, n_post5s, n_article_6s, n_tag_6s, ...).

Rails: `NestedAttributesTest` (nested_attributes_test.rb lines 1–240). Rails uses Human/Interest as the canonical model pair for most of these general hasMany nested-attributes tests.

## Acceptance criteria

- Convert `NestedAttributesTest` (lines 202–564) to use canonical Human/Interest (or Pirate/Bird where the test pattern fits hasMany with non-integer composite ids).
- Remove all associated `n_pirate_*`, `n_tag_*`, `n_article_*`, `n_comment_*`, `n_post_*` bespoke table entries from TEST_SCHEMA that were used only by this block.
- Test names verbatim. No regressions in test:compare.
- 500 LOC ceiling, PR from main.
