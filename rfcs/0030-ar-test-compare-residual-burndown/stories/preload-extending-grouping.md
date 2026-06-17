---
title: "Preloader groups same-SQL second-level assocs differing by extending"
status: in-progress
updated: 2026-06-17
rfc: "0030-ar-test-compare-residual-burndown"
cluster: associations
deps: []
deps-rfc: []
est-loc: 120
priority: 50
pr: 3533
claim: "2026-06-17T12:01:25Z"
assignee: "preload-extending-grouping"
blocked-by: null
---

## Context

Surfaced during RFC 0030 story a6-inverse-and-association-tail. The
`preload groups queries with same sql at second level` test in
`packages/activerecord/src/associations.test.ts` stays `it.skip`: the preloader
must differentiate associations by their `extending` option so two second-level
preloads with the same SQL but different extensions (`comments` vs
`comments_with_extending`) group into a single query
(`assert_queries_count(4)`).

Rails ref: `vendor/rails/activerecord/test/cases/associations_test.rb`
(`test_preload_groups_queries_with_same_sql_at_second_level`).

## Acceptance criteria

- [ ] Preloader groups same-SQL second-level associations differing only by `extending`.
- [ ] Un-skip `preload groups queries with same sql at second level`; it passes (4 queries).
