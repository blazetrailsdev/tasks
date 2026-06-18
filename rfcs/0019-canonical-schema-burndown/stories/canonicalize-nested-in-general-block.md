---
title: "Canonicalize TestNestedAttributesInGeneral bespoke per-test classes"
status: ready
updated: 2026-06-18
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/activerecord/src/nested-attributes.test.ts` lines 1117–1679: `TestNestedAttributesInGeneral`. The largest block (~563 lines). Uses per-test inline bespoke classes with unique prefixed table names (n_article_as, n_tag_as, etc. — ~50 tables in the local TEST_SCHEMA) rather than a shared makeModels(). Rails: `TestNestedAttributesInGeneral` (nested_attributes_test.rb). Some tests already use canonical Human/Interest.

This block alone likely requires multiple PRs (500 LOC ceiling). Split by test group (e.g. first half through `validate presence` test, second half through `acceptsNestedAttributesFor` test).

## Acceptance criteria

- Convert all tests in `TestNestedAttributesInGeneral` to canonical models (Human/Interest for general patterns; Pirate/Bird or Post/Comment for hasmany patterns).
- Remove all `n_article_*`, `n_tag_*`, `n_pirate_*`, `n_bird_*`, `n_post_*`, `n_comment_*`, `n_boat_*`, `n_part_*` bespoke table entries from TEST_SCHEMA.
- Test names verbatim. No regressions in test:compare.
- Split into multiple PRs from main with non-overlapping describe/test groups if needed.
