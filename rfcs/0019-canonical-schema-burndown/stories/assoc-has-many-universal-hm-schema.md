---
title: "assoc-has-many-universal-hm-schema"
status: ready
updated: 2026-06-28
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/activerecord/src/associations/has-many-associations.test.ts` contains `UNIVERSAL_HM_SCHEMA`
(lines 83–267 in the pre-conversion file) that backs the main `describe("HasManyAssociationsTest")`
block (lines 1699–7155, approximately 230 tests). This schema defines ~300 bespoke scratch tables
(prefixed `am_`/`au_`/etc.) for the largest has-many test suite in the file.

The tail schemas (`TAIL_HMT_SCHEMA`, `TAIL_HMT2_SCHEMA`, `COUNTER_CACHE_HEAD_SCHEMA`) were already
converted in PR assoc-has-many-residual-schemas-universal (story assoc-has-many-residual-schemas-universal).

RFC 0019 canonical-schema burndown requires this file to be removed from
`eslint/require-canonical-schema-exclude.json`, which is blocked until ALL schemas including
UNIVERSAL_HM_SCHEMA are converted. The file has been grandfathered per RFC 0019 baseline.

Rails source:

- `vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb`
- Main `HasManyAssociationsTest` class (~3285 lines)
- Fixtures: accounts, categories, companies, developers, projects, developers_projects, topics,
  authors, author_addresses, comments, posts, readers, taggings, cars, tags, categorizations,
  zines, interests, humans, cpk_books, cpk_authors

## Acceptance criteria

- [ ] `UNIVERSAL_HM_SCHEMA` const and all its bespoke table definitions deleted
- [ ] The main `describe("HasManyAssociationsTest")` block (lines 1699–7155 of the original file)
      converted to use canonical `TEST_SCHEMA` models and `useHandlerFixtures`
- [ ] Tests that hit impl gaps are `it.skip` with a comment referencing the gap story
- [ ] File removed from `eslint/require-canonical-schema-exclude.json`
- [ ] `pnpm vitest run packages/activerecord/src/associations/has-many-associations.test.ts` passes
- [ ] Test names UNCHANGED (test:compare matching)
- [ ] PR opened as draft with `Closes-story:` trailer
