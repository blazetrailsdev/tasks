---
title: "associations-test-preloadertest-canonical-wave3"
status: ready
updated: 2026-06-19
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/activerecord/src/associations.test.ts` PreloaderTest describe block. PR #WAVE2 (wave 2) converted ~24 tests to canonical tables. The following tests remain bespoke due to 500 LOC ceiling:

**Through/polymorphic-taggings tests** (need `as: "taggable"` pattern change):

- "preload grouped queries of middle records" (gmm_posts, gmm_taggings, gmm_tags)
- "preload grouped queries of through records" (ggt_posts, ggt_taggings, ggt_tags)
- "preload through records with already loaded middle record" (gat_posts, gat_taggings, gat_tags)
- "preload through" (pt_posts, pt_taggings, pt_tags)

**Complex multi-level through** (pp\_\* tables - 6 bespoke tables):

- "preload can group multi level ping pong through"

**Through with favorites join table** (sl\_\* tables):

- "preload can group separate levels"

**Through instance-dependent scope on through** (pwtiss\_\* tables):

- "preload with through instance dependent scope"

Convert these to canonical: posts/tags/taggings (polymorphic via `as: "taggable"`), authors, comments, author_favorites tables. The taggings tests need FK changes from e.g. `gmm_post_id`/`gmm_tag_id` to `taggable_id`/`taggable_type`/`tag_id`. Wave 2 confirmed this pattern works for IA/SL.

Rails source: `vendor/rails/activerecord/test/cases/associations_test.rb` PreloaderTest.

## Acceptance criteria

- 7 remaining tests converted to canonical tables
- All 7 bespoke table groups removed from defineSchema (gmm*\*, ggt*\_, gat\__, pt*\*, pp*_, sl\_\_, pwtiss\_\*)
- `test:compare` delta non-negative
- 500 LOC ceiling: split into additional waves if needed
- Once complete + TA/TB wave done: remove `associations.test.ts` from `eslint/require-canonical-schema-exclude.json`
