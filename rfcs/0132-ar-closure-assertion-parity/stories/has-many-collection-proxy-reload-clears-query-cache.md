---
title: "has-many-collection-proxy-reload-clears-query-cache"
status: done
updated: 2026-09-22
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7947
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split out of `assertions-has-many-associations-remainder-5` after two PRs (trails#7947, trails#7949)
both took that story. #7949 carries the build / dirty-target / delete_all / replace / extend slice.
This story covers what only #7947 adds.

- `CollectionProxy#reload` (`packages/activerecord/src/associations/collection-proxy.ts`) resets
  state by hand and never calls `proxy_association.reload(true)`, so it skips
  `klass.connection_pool.clear_query_cache` (`activerecord/lib/active_record/associations/collection_proxy.rb:1085-1088`,
  `associations/association.rb:72-78`) and serves stale cached rows.
- `reload with query cache` / `reloading unloaded associations with query cache`
  (`has_many_associations_test.rb:927-970`) use invented author/post models; they belong on
  canonical companies fixtures.
- `collection size with dirty target` (`has_many_associations_test.rb:1158-1166`) should be on the
  canonical posts/readers fixtures if #7949 did not converge it.
- `assertQueriesMatch` (`packages/activerecord/src/testing/query-assertions.ts`) should materialize
  transactions first and wrap its block in `_assert_nothing_raised_or_warn("assert_queries_match")`
  (`activerecord/lib/active_record/testing/query_assertions.rb:59-75`).

## Acceptance criteria

- `CollectionProxy#reload` is `proxyAssociation.reload(true)` followed by `resetScope`.
- The three tests above show 0 assertion mismatches in
  `pnpm parity:test -- --package activerecord --assertions --missing`.
- `assertQueriesMatch` matches `query_assertions.rb:59-75`.
