---
title: "relation-joins-select-bigint"
status: done
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8085
claim: "2026-09-25T14:11:37Z"
assignee: "time-subsec-drops-subnano-residual"
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `relations_test.rb` assertions (assertions-relations-test, RFC 0132). The converged test is parked `it.skip` in `packages/activerecord/src/relations.test.ts`: **"joins with select"**.

- Rails: activerecord relations_test.rb:2212 (Post.joins(:author).select("id", "authors.author_address_id"))
- trails: packages/activerecord/src/relation/query-methods.ts select + joins
- Observed: posts.map(p => p.author_address_id) is [1n, 1n, 1n] (bigint) where Rails yields Integers

## Acceptance criteria

- The parked test in `relations.test.ts` is un-skipped (its BLOCKED line removed) and passes with its Rails assertions unchanged.
- The behaviour matches the Rails source cited above, method by method.
